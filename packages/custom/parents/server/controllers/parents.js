/**
 * Created by shouliang on 2016/9/29.
 */
var app = require('meanio').app;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var _ = require('lodash');
var Promise = require('bluebird');
//mongoose.Promise = Promise;
var async = require('async');

// 家长关联孩子
function relateChildren(req, res) {
    var name = req.query.name ? req.query.name : '';
    var mobile = req.query.mobile ? req.query.mobile : '';
    var parent = req.user;

    User.findOne({name: name, mobile: mobile, userType: 'student'}).exec() // create promise
        .then(function (user) {

            if (_.findIndex(parent.profile.children || [], {username: user.username}) >= 0) {
                return Promise.reject('已关联该孩子');
            }

            parent.profile.children = (parent.profile.children || []).concat(
                {
                    _id: user._id.toString(),
                    username: user.username,
                    name: user.name
                });
            parent.markModified('profile.children');
            return parent.save(); // return promise
        })
        .then(function (parent) {
            res.json({result: 1, data: parent});
        })
        .catch(function (err) {
            res.json({result: 0, data: err || err.message})
        })

}

// 通过学生Ids，获得家长信息
function getParentsByChildrenIds(Ids) {
    if (!_.isArray(Ids)) {
        Ids = [Ids];
    }

    var promiseFuns = [];
    _.each(Ids, function (item) {
        promiseFuns.push(
            User.find({'profile.children._id': item})
                .exec()
        );
    })

    return Promise.all(promiseFuns);
}

// 老师布置作业，通知家长
function notificationFromTask(noti_Options) {
    getParentsByChildrenIds(noti_Options.children)
        .then(function (user) {
            var users = _.flatten(user);
            var parents = _.map(users, "_id");

            if (parents && parents.length > 0) {
                var notification = {
                    title: noti_Options.notiTitle,
                    content: noti_Options.taskTitle + '.请进入作业列表查看',
                    from: {
                        name: noti_Options.teacherName,
                        userId: noti_Options.teacherUserId
                    },
                    to: parents
                };
                app.get('notificationEvent').emit('notification_multiple', notification);
            }
        });
}

// 孩子的作业列表
function childrenTasks(req, res) {
    var Task = mongoose.model('Task');
    var page = req.query.page ? parseInt(req.query.page) : 1;
    var pageItem = req.query.pageItem ? parseInt(req.query.pageItem) : 20;
    var childrenId = req.query.childrenId || '';

    var query = {'accepters': childrenId.toString()};
    if (req.query.subject) {
        query['content.subject'] = req.query.subject;
    }
    if (req.query.status) {
        if (req.query.status === '已批改') {
            query['status'] = req.query.status;
        } else {
            query['status'] = {$ne: '已批改'};
        }

    }
    async.parallel([function (callback) {
        Task.count(query, function (err, result) {
            callback(err, result);
        });
    }, function (callback) {
        Task.find(query)
            .sort({created: -1})
            .skip((page - 1) * pageItem)
            .limit(pageItem)
            .populate('executed')
            .populate('content.book', "_id name grade subject session cover", 'TeacherBook')
            .exec(function (err, results) {
                callback(err, results);
            });
    }], function (err, results) {
        if (err) return res.status(500).send("数据库操作错误");
        var list = results[1];
        var resultList = [];
        var selfId = childrenId.toString();
        _.each(list, function (item) {
            item = item.toObject();
            if (item.executed && item.executed.length > 0) {
                for (var i = 0; i < item.executed.length; i++) {
                    if (item.executed[i].user.toString() === selfId) {
                        item.done = true;
                        item.taskExe = item.executed[i];
                        item.status = item.executed[i].status;
                        break;
                    }
                }
            }
            resultList.push(item);
        });
        return res.json({
            result: 1,
            data: {count: results[0], list: resultList, page: page, pageItem: pageItem}
        });
    })

}

// 孩子的老师列表
function getTeachers(req, res) {
    var children = req.user.profile.children || [];
    var childrenIds = _.map(children, "_id");
    var Class = mongoose.model("Cclass");
    var teachers = [];

    Class.find({'members.userId': {$in: childrenIds}})
        .select({grade: 1, members: 1, _id: -1})
        .exec(function (err, classes) {
            if (err) return res.status(500).json({result: 0, data: err});
            for (var i = 0, len = children.length; i < len; i++) {
                for (var j = 0, clen = classes.length; j < clen; j++) {
                    var grade = classes[j].grade;
                    var members = classes[j].members;
                    var teacher = _.find(members, {userType: 'teacher'});
                    var child = _.find(members, {userId: children[i]._id});
                    if (teacher && child) {
                        teacher.grade = grade;
                        teacher.student = child;
                        teachers.push(teacher);
                    }
                }
            }

            res.status(200).json({result: 1, data: _.uniq(teachers)});
        })
}

module.exports = {
    relateChildren: relateChildren,
    notificationFromTask: notificationFromTask,
    childrenTasks: childrenTasks,
    getTeachers: getTeachers
}