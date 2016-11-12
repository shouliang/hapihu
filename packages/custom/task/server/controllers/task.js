/**
 * Created by Heidi on 2016/7/7.
 */
var app = require('meanio').app,
    _ = require('lodash'),
    async = require('async'),
    mongoose = require('mongoose'),
    Task = mongoose.model('Task'),
    TaskExe = mongoose.model('TaskExe'),
    MyAnswer = mongoose.model('MyAnswer'),
    Klass = mongoose.model('Cclass');
var Resource = mongoose.model('Resource');
var Topic = mongoose.model('Topic');
var User = mongoose.model('User');
var Promise = require('bluebird');
//mongoose.Promise = Promise;

var moment = require('moment');
var parents = require('../../../parents/server/controllers/parents');

var common = require("../../../common/server/controllers/index")();

//查询是否已经回答过 userIds ; id or ids array
var checkTopicAnswer = function (topic, userIds, next) {
    if (!_.isArray(userIds)) {
        userIds = [userIds];
    }
    _.each(userIds, function (item) {
        if (typeof (item) === 'string') {
            item = mongoose.Types.ObjectId(item);
        }
    });
    if (typeof (topic) === 'string') {
        topic = mongoose.Types.ObjectId(topic);
    }
    MyAnswer.find({
        user: {$in: userIds},
        topic: topic
    }).populate('user', '_id name username').exec(function (err, results) {
        next(err, results);
    });
};
var resourcesByKnowledge = function (knowledgePoints, next) {
    var resources = [];
    if (!knowledgePoints || knowledgePoints.length === 0) return next(null, resources);
    var lastLevelPoint = [];
    _.each(knowledgePoints, function (item) {
        if (item && item._id && !hasSon(item, knowledgePoints)) {
            var id = item._id;
            if (_.isString(id)) {
                id = mongoose.Types.ObjectId(id);
            }
            lastLevelPoint.push(id);
        }
    });
    if (lastLevelPoint.length === 0) {
        return next(null, resources);
    }

    Resource.find({knowledge: {$in: lastLevelPoint}}).sort('-created')
        .populate('knowledge', '_id title parent level')
        .exec(function (err, results) {
            if (err) return next('数据库访问失败');
            return next(null, results);
        });
};
var hasSon = function (item, points) {
    for (var i = 0; i < points.length; i++) {
        if (points[i].parent.toString() === item._id.toString()) {
            return points[i];
        }
    }
    return null;
};
module.exports = function (task_package) {
    return {
        task: function (req, res, next, id) {
            Task.load(id, function (err, task) {
                if (err) return res.status(500).send('数据库操作失败');
                if (!task) {
                    return res.status(400).send('没有找到');
                }
                req.task = task;
                next();
            });
        },
        create: function (req, res, next) {
            if (!req.body.task) return res.status(400).send('缺少参数');
            async.waterfall([
                function (cb) {
                    //handle task content
                    var content = req.body.task.content;
                    if (!content) return cb('没有内容');
                    if (content.bookId) {
                        content.book = mongoose.Types.ObjectId(content.bookId);
                    }
                    if (content.topics && content.topics.length > 0) {
                        var Topic = mongoose.model('Topic');
                        Topic.find({_id: {$in: content.topics}}).select('image.pageImg image.page image.stem.pageImg image.stem.page image.answerBlock.pageImg image.answerBlock.page')
                            .exec(function (err, results) {
                                if (err) return cb(err);
                                var pages = [];
                                _.each(results, function (item) {
                                    if (item.image && item.image.pageImg) {
                                        var page = {
                                            page: parseInt(item.image.page),
                                            pageImg: item.image.pageImg
                                        };
                                        pages.push(page);
                                        if (item.image.stem) {
                                            _.each(item.image.stem, function (jtem) {
                                                if (jtem.pageImg) {
                                                    page = {
                                                        page: parseInt(jtem.page),
                                                        pageImg: jtem.pageImg
                                                    };
                                                    pages.push(page);
                                                }
                                            });
                                        }
                                        if (item.image.answerBlock) {
                                            _.each(item.image.answerBlock, function (jtem) {
                                                if (jtem.pageImg) {
                                                    page = {
                                                        page: parseInt(jtem.page),
                                                        pageImg: jtem.pageImg
                                                    };
                                                    pages.push(page);
                                                }
                                            });
                                        }
                                    }
                                });
                                pages = _.uniqBy(pages, 'page');
                                content.pageImgs = pages;
                                cb(null, content);
                            });
                    }
                },
                function (content, cb) {
                    //save task
                    var task = new Task(req.body.task);
                    task.user = req.user;
                    task.content = content;
                    task.save(function (err) {
                        if (err) return cb('数据库操作失败');
                        cb(null, task);
                    });
                },
                function (task, cb) {
                    //notification
                    var toMembers = [];
                    if (task.type === 'class') {
                        //to classes
                        async.each(task.to, function (item, callback) {
                            Klass.load(item.classId, function (err, result) {
                                if (err) return callback(err);
                                if (result) {
                                    var members = result.members || [];
                                    _.each(members, function (member) {
                                        if (member.userType === 'student' && member.status === '审核成功') {
                                            toMembers.push(member.userId);
                                        }
                                    });
                                    callback();
                                } else {
                                    callback();
                                }
                            });
                        }, function (err) {
                            if (toMembers.length > 0) {
                                //save to task accepters
                                task.accepters = toMembers;
                                task.save();

                                //notify to user
                                var notification = {
                                    title: '您有一新作业',
                                    content: task.title + '.请进入作业列表查看',
                                    link: {
                                        taskId: task._id
                                    },
                                    from: {
                                        name: req.user.name,
                                        userId: req.user._id.toString()
                                    },
                                    to: toMembers
                                };
                                app.get('notificationEvent').emit('notification_multiple', notification);

                                // 教师布置完作业后通知家长功能
                                var noti_Options = {
                                    teacherName: req.user.name,
                                    teacherUserId: req.user._id.toString(),
                                    taskTitle: task.title,
                                    notiTitle: '您的孩子有一新作业',
                                    children: toMembers
                                }
                                parents.notificationFromTask(noti_Options);
                            }
                        });

                    } else if (task.type === 'member') {
                        // to users
                        toMembers = task.to || [];
                        if (toMembers.length > 0) {
                            //save to task accepters
                            task.accepters = toMembers;
                            task.save();

                            //notify to user
                            var notification = {
                                title: '您有一新作业',
                                content: task.title + '.请进入作业列表查看',
                                from: {
                                    name: req.user.name,
                                    userId: req.user._id.toString()
                                },
                                to: toMembers
                            };
                            app.get('notificationEvent').emit('notification_multiple', notification);

                            //教师布置完作业后通知家长功能
                            var noti_Options = {
                                teacherName: req.user.name,
                                teacherUserId: req.user._id.toString(),
                                taskTitle: task.title,
                                notiTitle: '您的孩子有一新作业',
                                children: toMembers
                            }
                            parents.notificationFromTask(noti_Options);
                        }

                    } else {
                        //other task type

                    }
                    cb(null, task);
                }
            ], function (err, result) {
                if (err) return res.status(400).send(err);
                return res.json({result: 1, data: result});
            });
        },
        find: function (req, res) {
            var classId = req.query.classId;
            if (req.user.userType === 'student') {
                TaskExe.findOne({user: req.user._id, task: req.task._id}, function (err, result) {
                    if (err) return res.status(500).send("数据库访问错误");
                    var task = req.task.toObject();
                    if (result) {
                        task.myAnswer = result;
                    }
                    return res.json({result: 1, data: task});
                });
            } else if (req.user.userType === 'teacher' || req.user.userType === 'schooler' || req.user.userType === 'unioner') {
                var User = mongoose.model('User');
                async.waterfall([function (callback) {
                    //get accepters
                    if (!classId) {
                        if (req.task.accepters && req.task.accepters.length > 0) {
                            var accepters = [];
                            _.each(req.task.accepters, function (item) {
                                accepters.push(mongoose.Types.ObjectId(item));
                            });
                            User.find({_id: {$in: accepters}})
                                .select({_id: 1, name: 1, username: 1, pinyin: 1, profile: 1})
                                .sort({pinyin: -1})
                                .exec(function (err, results) {
                                    accepters = [];
                                    _.each(results, function (item) {
                                        var ob = item.toObject();
                                        ob.userId = ob._id;
                                        accepters.push(ob);
                                    });
                                    return callback(err, accepters);
                                });
                        } else {
                            return callback(null, []);
                        }
                    } else if (classId) {
                        var Klass = mongoose.model('Cclass');
                        Klass.load(classId, function (err, result) {
                            if (err) return callback(err);
                            if (!result) return callback('班级不存在');
                            var accepters = [];
                            _.each(result.members, function (item) {
                                if (item.status.indexOf('成功') !== -1 && item.userType === 'student') {
                                    accepters.push(mongoose.Types.ObjectId(item.userId));
                                }
                            });
                            User.find({_id: {$in: accepters}})
                                .select({_id: 1, name: 1, username: 1, pinyin: 1, profile: 1})
                                .sort({pinyin: -1})
                                .exec(function (err, results) {
                                    var accepters = [];
                                    _.each(results, function (item) {
                                        var ob = item.toObject();
                                        ob.userId = ob._id;
                                        accepters.push(ob);
                                    });
                                    return callback(err, accepters);
                                });
                        });
                    }

                }, function (users, callback) {
                    //get taskexe
                    if (req.task.executed && req.task.executed.length > 0 && users.length > 0) {
                        var accepters = [];
                        _.each(users, function (item) {
                            accepters.push(item._id);
                        });
                        TaskExe.find({_id: {$in: req.task.executed}, user: {$in: accepters}})
                            .sort({created: -1})
                            .exec(function (err, results) {
                                var executors = users;
                                _.each(results, function (item) {
                                    var index = _.findIndex(executors, {_id: item.user});
                                    if (index > -1) {
                                        executors[index].taskExe = item.toObject();
                                    }
                                });
                                return callback(err, executors);
                            });
                    } else {
                        callback(null, []);
                    }
                }], function (err, results) {
                    var task = req.task.toObject();
                    task.executors = results;
                    task.currentClassId = classId;
                    return res.json({result: 1, data: task});
                })

            } else {
                return res.json({result: 1, data: req.task});
            }

        },
        update: function (req, res) {
            var task = req.task;
            task = _.extend(task, req.body);
            task.save(function (err) {
                if (err) {
                    return res.status(500).send("更新失败");
                }
                // 若更新task状态为'已批改'，则相应的taskExe也全部更新为'已批改'
                if (req.body.status && req.body.status === '已批改') {
                    var taskExeIds = task.executed || [];
                    var fnTasks = [];
                    TaskExe.find({_id: {$in: taskExeIds}})
                        .exec(function (err, results) {
                            if (err) return res.status(500).send("数据库访问失败");

                            for (var i = 0; i < results.length; i++) {
                                fnTasks.push(
                                    (function (taskexe) {
                                        return function (callback) {
                                            if (taskexe.status === "已批改") {
                                                return callback(null, taskexe);
                                            }
                                            taskexe.status = "已批改";
                                            taskexe.save(function (err) {
                                                if (err) return callback(err);
                                                callback(null, taskexe);
                                            });
                                        }
                                    })(results[i])
                                );
                            }

                            async.parallel(fnTasks, function (err, results) {
                                if (err) return res.status(500).send("数据库访问失败");
                                return res.json({result: 1, data: task});
                            })
                        });
                } else {
                    res.json({result: 1, data: task});
                }

            });
        },
        delete: function (req, res) {

        },

        // 关联阅卷者
        relateChecker: function (req, res) {
            var checkerUsername = req.body.checkerUsername || ''; // 批阅者姓名
            var to = req.body.to || [];                           // 指定班级
            if (!checkerUsername || (to.length === 0)) {
                res.status(400).json({result: 0, data: '参数错误'});
            }

            // TODO 测试数据 待删除
            // checkerUsername = 'teacher3';
            // to = [
            //     {
            //         "checked": true,
            //         "grade": "九年级",
            //         "classId": "57abf84c06e356e41a86e9a1",
            //         "name": "九年级（三）班"
            //     }];

            var task = req.task;
            var classIds = [];
            _.each(to, function (klass) {
                classIds.push(mongoose.Types.ObjectId(klass.classId));
            })

            var checker = {};
            User.findOne({username: checkerUsername}).exec()  // 查询checkUsername是否存在
                .then(function (user) {
                    if (user) {

                        if (_.findIndex(task.checkers || [], {userId: user._id}) >= 0) {
                            return Promise.reject('该用户已经分配任务');
                        }

                        checker.userId = user._id;
                        checker.username = user.username;
                        checker.name = user.name;

                        var Klass = mongoose.model('Cclass');
                        return Klass.find({_id: {$in: classIds}}).exec();
                    } else {
                        return Promise.reject('该用户不存在')
                    }
                })
                .then(function (klasses) {
                    var allMembers = [];
                    _.each(klasses, function (klass) {
                        allMembers.push(klass.members);
                    })
                    var members = _.flatten(allMembers);

                    var studentIds = [];
                    _.each(members, function (item) {
                        if (item.status.indexOf('成功') !== -1 && item.userType === 'student') {
                            studentIds.push(mongoose.Types.ObjectId(item.userId));
                        }
                    });

                    return User.find({_id: {$in: studentIds}})
                        .select({_id: 1, name: 1, username: 1, pinyin: 1, profile: 1})
                        .sort({pinyin: -1})
                        .exec()
                })
                .then(function (users) {
                    var accepters = [];
                    var userIds = [];
                    _.each(users, function (item) {
                        userIds.push(item._id);
                        var ob = item.toObject();
                        accepters.push(ob._id.toString());
                    });

                    checker.to = to;
                    checker.content = req.body.content || task.content;
                    checker.status = '待批改';
                    checker.accepters = accepters;

                    return Promise.resolve({task: task, users: userIds});
                })
                .then(function (result) {
                    return TaskExe.find({task: result.task._id, user: {$in: result.users}}).exec();
                })
                .then(function (taskExes) {
                    var executed = [];
                    _.each(taskExes, function (taskexe) {
                        executed.push(taskexe._id);
                    })
                    checker.executed = executed;
                    task.checkers = (task.checkers || []).concat(checker);

                    return task.save();
                })
                .then(function (task) {
                    res.status(200).json({result: 1, data: checker});
                })
                .catch(function (err) {
                    res.status(400).json({result: 0, data: err});
                })
        },

        // 删除批阅者
        delRelateChecker: function (req, res) {
            var userId = req.query.userId || '';
            if (!userId) {
                return res.status(400).json({result: 0, data: '缺少参数'});
            }
            var task = req.task;

            var checkers = task.checkers || [];
            var index = _.findIndex(checkers, {userId: mongoose.Types.ObjectId(userId)});
            if (index >= 0) {
                task.checkers = checkers.slice(0, index).concat(checkers.slice(index + 1, checkers.length + 1));
                task.save(function (err) {
                    if (err) res.status(500).json({result: 0, data: '数据库错误'});
                    return res.status(200).json({result: 1, data: task.checkers});
                });
            } else {
                return res.status(200).json({result: 0, data: '未关联该用户,不能删除'});
            }
        },

        // 试卷 个人报告
        checkerFindTask: function (req, res) {
            var classIds = req.query.classIds;
            if (classIds && !_.isArray(classIds)) {
                classIds = [classIds];
            }
            var userType = req.user.userType;
            switch (userType) {
                case 'student':
                    TaskExe.findOne({user: req.user._id, task: req.task._id}, function (err, result) {
                        if (err) return res.status(500).send("数据库访问错误");
                        var task = req.task.toObject();
                        if (result) {
                            task.myAnswer = result;
                        }
                        return res.json({result: 1, data: task});
                    });
                    break;
                case 'teacher':
                case 'schooler':
                case 'unioner':
                    var User = mongoose.model('User');
                    async.waterfall([function (callback) {
                        //get checker accepters
                        if (classIds) {
                            var Klass = mongoose.model('Cclass');
                            Klass.find({_id: {$in: classIds}})
                                .exec(function (err, klasses) {
                                    if (err) return callback(err);
                                    if (!klasses) return callback('班级不存在');
                                    var members = [];
                                    _.each(klasses, function (klass) {
                                        if (klass.members) {
                                            _.each(klass.members, function (item) {
                                                if (item.userType === 'student' && item.status.indexOf('成功') !== -1) {
                                                    members.push(mongoose.Types.ObjectId(item.userId));
                                                }
                                            })
                                        }
                                    })

                                    User.find({_id: {$in: members}})
                                        .select({_id: 1, name: 1, username: 1, pinyin: 1, profile: 1})
                                        .sort({pinyin: -1})
                                        .exec(function (err, results) {
                                            var accepters = [];
                                            _.each(results, function (item) {
                                                var ob = item.toObject();
                                                ob.userId = ob._id;
                                                accepters.push(ob);
                                            });
                                            return callback(err, accepters);
                                        });
                                })
                        } else {
                            var checker = _.find(req.task.checkers, {userId: req.user._id});
                            var accepterUsers = [];
                            if(checker) {
                                 accepterUsers = checker.accepters?checker.accepters:[];
                            }
                            else {
                                accepterUsers =  req.task.accepters;
                            }
                            if (accepterUsers && accepterUsers.length > 0) {
                                var accepters = [];
                                _.each(accepterUsers, function (item) {
                                    accepters.push(mongoose.Types.ObjectId(item));
                                });

                                User.find({_id: {$in: accepters}})
                                    .select({_id: 1, name: 1, username: 1, pinyin: 1, profile: 1})
                                    .sort({pinyin: -1})
                                    .exec(function (err, results) {
                                        accepters = [];
                                        _.each(results, function (item) {
                                            var ob = item.toObject();
                                            ob.userId = ob._id;
                                            accepters.push(ob);
                                        });
                                        return callback(err, accepters);
                                    });
                            } else {
                                return callback(null, []);
                            }
                        }
                    }
                    , function (users, callback) {
                        //get taskexe
                        if (req.task.executed && req.task.executed.length > 0 && users.length > 0) {
                            var accepters = [];
                            _.each(users, function (item) {
                                accepters.push(item._id);
                            });
                            TaskExe.find({_id: {$in: req.task.executed}, user: {$in: accepters}})
                                .sort({created: -1})
                                .exec(function (err, results) {
                                    var executors = users;
                                    _.each(results, function (item) {
                                        var index = _.findIndex(executors, {_id: item.user});
                                        if (index > -1) {
                                            executors[index].taskExe = item.toObject();
                                        }
                                    });
                                    return callback(err, executors);
                                });
                        } else {
                            callback(null, []);
                        }

                    }], function (err, results) {
                        var task = req.task.toObject();
                        task.executors = results;
                        return res.json({result: 1, data: task});
                    });
                    break;
                default:
                    return res.json({result: 1, data: req.task});
            }
        },

        // 某次作业各知识点正确率
        getTaskKnowledgeRightRate: function (req, res) {
            var classId = req.query.classId;

            var task = req.task;
            var acceptersLen = (task.accepters || []).length;

            async.auto({
                getMembers: function (callback) {
                    if (classId) {
                        var Klass = mongoose.model('Cclass');
                        Klass.load(classId, function (err, result) {
                            if (err) return callback(err);
                            if (!result) return callback('班级不存在');
                            var members = [];
                            if (result.members) {
                                _.each(result.members, function (item) {
                                    if (item.userType === 'student') {
                                        members.push(mongoose.Types.ObjectId(item.userId));
                                    }
                                })
                            }
                            callback(null, members);
                        });
                    } else {
                        callback(null, null);
                    }
                },

                getTaskExe: ["getMembers", function (callback, results) {
                    var taskExeConditions = {
                        task: task._id
                    };
                    if (classId) {
                        var members = results.getMembers;
                        taskExeConditions.user = {$in: members};
                    }
                    TaskExe.find(taskExeConditions)
                        .exec(function (err, taskexe) {
                            if (err) return callback(err);
                            callback(null, taskexe);
                        })
                }],
                getMyAnswer: ["getTaskExe", function (callback, results) {
                    var myAnswers = _.map(results.getTaskExe, "myAnswers");
                    var myAnswerIds = [];
                    _.each(myAnswers, function (myansws) {
                        _.each(myansws, function (item) {
                            myAnswerIds.push(item);
                        })
                    })

                    MyAnswer.find({_id: {$in: myAnswerIds}})
                        .populate('topic', '_id knowledge')
                        .exec(function (err, docs) {
                            var options = {
                                path: 'topic.knowledge',
                                select: '_id title level parent',
                                model: 'Knowledge'
                            };

                            if (err) return callback(err);
                            MyAnswer.populate(docs, options, function (err, myanswers) {
                                if (err) return callback(err);
                                callback(null, myanswers);
                            });
                        });
                }],
                getKonwledges: ["getTaskExe", function (callback, results) {
                    // 某次作业的多个taskexe里面，每个topics是一样的，只需要取其中一个就可以
                    var topics = (results.getTaskExe && results.getTaskExe[0] && results.getTaskExe[0].topics) || [];
                    var topicIds = [];
                    _.each(topics, function (item) {
                        topicIds.push(mongoose.Types.ObjectId(item));
                    })
                    Topic.find({_id: {$in: topicIds}})
                        .select('_id knowledge')
                        .populate('Knowledge', '_id title level parent')
                        .exec(function (err, topics) {
                            if (err) return callback(err);
                            callback(null, topics);
                        })
                }],
                rightRateOfKnowledge: ['getMyAnswer', function (callback, results) {
                    // 获取该次作业中各个知识点的个数统计
                    var topicKnowledges = results.getKonwledges;
                    var konwledgeCountByAry = [];
                    _.each(topicKnowledges, function (topicKnows) {
                        _.each(topicKnows.knowledge, function (item) {
                            konwledgeCountByAry.push(item.toString());
                        })
                    })

                    var konwledgeCountby = _.countBy(konwledgeCountByAry);

                    //以下为获取myAnswer中各知识点的正确个数
                    var knowledgeArray = [];
                    var answers = results.getMyAnswer;

                    for (var i = 0, answersLen = answers.length; i < answersLen; i++) {
                        var topicKnowledges = answers[i].topic.knowledge;
                        var status = answers[i].status;
                        var mark = answers[i].mark;

                        for (var j = 0, knowledgeLen = topicKnowledges.length; j < knowledgeLen; j++) {
                            var konwledge = topicKnowledges[j];
                            var objKnowledge = konwledge.toObject();

                            var knowledgeIndex = _.findIndex(knowledgeArray, ['_id', konwledge._id]);
                            if (knowledgeIndex < 0) {
                                if (status === '已批改' && mark === '对') {
                                    objKnowledge.right = (objKnowledge.right || 0) + 1;
                                }
                                knowledgeArray.push(objKnowledge);
                            } else {
                                if (status === '已批改' && mark === '对') {
                                    knowledgeArray[knowledgeIndex].right = ((knowledgeArray[knowledgeIndex].right || 0
                                            ) ||
                                            0
                                        )
                                        + 1;
                                }
                            }
                        }
                    }

                    // 最后统计各知识点正确率(只统计myanswer里面的知识点)
                    for (var i = 0, len = knowledgeArray.length; i < len; i++) {
                        var knowledgePick = _.pick(konwledgeCountby, [knowledgeArray[i]._id]);
                        if (knowledgePick) {
                            var knowledgeCount = knowledgePick[knowledgeArray[i]._id] * acceptersLen; // 乘以作业分配人数
                            knowledgeArray[i].rightRate = Math.round(knowledgeArray[i].right / knowledgeCount * 100);
                        }
                    }

                    callback(null, knowledgeArray);
                }]
            }, function (err, results) {
                if (err) return res.status(500).send({result: 0, data: '数据库操作错误'});

                var rightRateOfKnowledge = results.rightRateOfKnowledge;
                return res.json({result: 1, data: rightRateOfKnowledge});
            });
        },

        // 某特定学生 某时间段的作业涉及的知识点 正确率统计
        getStudentTaskKnowledgeRightRate: function (req, res) {
            var taskConditions = {};
            var myAnswerConditions = {};

            var user = req.body.user;
            //var user = '57abf40e06e356e41a86e998';
            if (user) {
                taskConditions.accepters = user;
                myAnswerConditions.user = mongoose.Types.ObjectId(user);
            }

            // 时间段
            var queryDate = {};
            if (req.query.beginDate && _.isDate(new Date(req.query.beginDate))) {
                queryDate["$gte"] = moment(new Date(req.query.beginDate));
                taskConditions.created = queryDate;
            }

            if (req.query.endDate && _.isDate(new Date(req.query.endDate))) {
                queryDate["$lt"] = moment(new Date(req.query.endDate)).add(1, 'd');
                taskConditions.created = queryDate;
            }

            async.auto({
                getTask: function (callback) {
                    Task.find(taskConditions)
                        .exec(function (err, tasks) {
                            if (err) return callback(err);
                            callback(null, tasks);
                        });
                },
                getTaskExe: ["getTask", function (callback, results) {
                    var taskIds = _.map(results.getTask, "_id") || [];
                    TaskExe.find({task: {$in: taskIds}})
                        .exec(function (err, taskexes) {
                            if (err) return callback(err);
                            callback(null, taskexes);
                        })
                }],
                getKonwledges: ["getTaskExe", function (callback, results) {
                    var topics = [];
                    for (var i = 0, len = results.getTaskExe.length; i < len; i++) {
                        topics.push(results.getTaskExe[i].topics);
                    }

                    var topicIds = [];
                    _.each(topics, function (tps) {
                        _.each(tps, function (item) {
                            topicIds.push(mongoose.Types.ObjectId(item));
                        })
                    })

                    Topic.find({_id: {$in: topicIds}})
                        .select('_id knowledge')
                        .populate('Knowledge', '_id title level parent')
                        .exec(function (err, topics) {
                            if (err) return callback(err);
                            callback(null, topics);
                        })
                }],
                getMyAnswer: ["getTaskExe", function (callback, results) {
                    var myAnswers = _.map(results.getTaskExe, "myAnswers") || [];
                    var myAnswerIds = [];
                    _.each(myAnswers, function (myansws) {
                        _.each(myansws, function (item) {
                            myAnswerIds.push(item);
                        })
                    })

                    myAnswerConditions._id = {$in: myAnswerIds};

                    MyAnswer.find(myAnswerConditions)
                        .populate('topic', '_id knowledge')
                        .exec(function (err, docs) {
                            var options = {
                                path: 'topic.knowledge',
                                select: '_id title level parent',
                                model: 'Knowledge'
                            };

                            if (err) return callback(err);
                            MyAnswer.populate(docs, options, function (err, myanswers) {
                                if (err) return callback(err);
                                callback(null, myanswers);
                            });
                        });
                }],
                rightRateOfKnowledge: ['getMyAnswer', function (callback, results) {
                    // 获取作业中各个知识点的个数统计
                    var topicKnowledges = results.getKonwledges;
                    var konwledgeCountByAry = [];
                    _.each(topicKnowledges, function (topicKnows) {
                        _.each(topicKnows.knowledge, function (item) {
                            konwledgeCountByAry.push(item.toString());
                        })
                    })

                    var konwledgeCountby = _.countBy(konwledgeCountByAry);

                    //以下为获取myAnswer中各知识点的正确个数
                    var knowledgeArray = [];
                    var answers = results.getMyAnswer;

                    for (var i = 0, answersLen = answers.length; i < answersLen; i++) {
                        var topicKnowledges = answers[i].topic.knowledge;
                        var status = answers[i].status;
                        var mark = answers[i].mark;

                        for (var j = 0, knowledgeLen = topicKnowledges.length; j < knowledgeLen; j++) {
                            var konwledge = topicKnowledges[j];
                            var objKnowledge = konwledge.toObject();

                            var knowledgeIndex = _.findIndex(knowledgeArray, ['_id', konwledge._id]);
                            if (knowledgeIndex < 0) {
                                if (status === '已批改' && mark === '对') {
                                    objKnowledge.right = (objKnowledge.right || 0) + 1;
                                }
                                knowledgeArray.push(objKnowledge);
                            } else {
                                if (status === '已批改' && mark === '对') {
                                    knowledgeArray[knowledgeIndex].right = (knowledgeArray[knowledgeIndex].right || 0) + 1;
                                }
                            }
                        }
                    }

                    // 最后统计各知识点正确率(只统计myanswer里面的知识点)
                    for (var i = 0, len = knowledgeArray.length; i < len; i++) {
                        var knowledgePick = _.pick(konwledgeCountby, [knowledgeArray[i]._id]);
                        if (knowledgePick) {
                            var knowledgeCount = knowledgePick[knowledgeArray[i]._id];
                            knowledgeArray[i].rightRate = Math.round((knowledgeArray[i].right || 0) / knowledgeCount * 100);
                        }
                    }

                    callback(null, knowledgeArray);
                }],
                getUser: function (callback) {
                    var userConditions = {};
                    if (user) {
                        userConditions._id = mongoose.Types.ObjectId(user);
                    }
                    User.findOne(userConditions)
                        .select('_id name username')
                        .exec(function (err, user) {
                            if (err) return callback(err);
                            callback(null, user);
                        })
                }
            }, function (err, results) {
                if (err) return res.status(500).send({result: 0, data: '数据库操作错误'});

                var user = results.getUser;
                var rightRateOfKnowledge = results.rightRateOfKnowledge;
                return res.json({result: 1, data: {user: user, rightRateOfKnowledge: rightRateOfKnowledge}});
            });
        },

        // 某特定学生 某时间段的作业的提交率
        getStudentTaskExecutedRate: function (req, res) {
            var taskConditions = {};

            var user = req.body.user;
            //var user = '57abf04ed45ba1541754fbb2';
            if (user) {
                taskConditions.accepters = user;
            }

            // 时间段
            var queryDate = {};
            if (req.query.beginDate && _.isDate(new Date(req.query.beginDate))) {
                queryDate["$gte"] = moment(new Date(req.query.beginDate));
                taskConditions.created = queryDate;
            }

            if (req.query.endDate && _.isDate(new Date(req.query.endDate))) {
                queryDate["$lt"] = moment(new Date(req.query.endDate)).add(1, 'd');
                taskConditions.created = queryDate;
            }

            async.auto({
                getTask: function (callback) {
                    Task.find(taskConditions)
                        .exec(function (err, tasks) {
                            if (err) return callback(err);
                            callback(null, tasks);
                        });
                },
                getTaskExe: ["getTask", function (callback, results) {
                    var conditions = {};
                    if (user) {
                        conditions.user = mongoose.Types.ObjectId(user);
                    }
                    var taskIds = _.map(results.getTask, '_id');
                    conditions.task = {$in: taskIds};
                    TaskExe.find(conditions)
                        .populate('user', '_id name username')
                        .exec(function (err, taskexes) {
                            if (err) return callback(err);
                            callback(null, taskexes);
                        });
                }],
                getUser: function (callback) {
                    var userConditions = {};
                    if (user) {
                        userConditions._id = mongoose.Types.ObjectId(user);
                    }
                    User.findOne(userConditions)
                        .select('_id name username')
                        .exec(function (err, user) {
                            if (err) return callback(err);
                            callback(null, user);
                        })
                }
            }, function (err, results) {
                if (err) return res.status(500).send({result: 0, data: '数据库操作错误'});

                var tasks = results.getTask || [];
                var tasksCount = tasks.length;
                var taskexes = results.getTaskExe || 0;
                var taskexesCount = taskexes.length || 0;
                var user = results.getUser;

                var executedRate = tasksCount > 0 ? Math.round(taskexesCount / tasksCount * 100) : 0;
                res.json({
                    result: 1,
                    data: {
                        user: user,
                        executedRate: executedRate
                    }
                });

            });
        },

        // 某次 考试 各知识点正确率
        getExamKnowledgeRightRate: function (req, res) {
            var classIds = req.query.classIds;
            if (classIds && !_.isArray(classIds)) {
                classIds = [classIds];
            }

            var task = req.task;
            var acceptersLen = (task.accepters || []).length;

            async.auto({
                getMembers: function (callback) {
                    if (classIds) {
                        Klass.find({_id: {$in: classIds}})
                            .exec(function (err, klasses) {
                                if (err) return callback(err);
                                if (!klasses) return callback('班级不存在');
                                var members = [];
                                _.each(klasses, function (klass) {
                                    if (klass.members) {
                                        _.each(klass.members, function (item) {
                                            if (item.userType === 'student' && item.status.indexOf('成功') !== -1) {
                                                members.push(mongoose.Types.ObjectId(item.userId));
                                            }
                                        })
                                    }
                                })

                                callback(null, members);
                            })
                    } else {
                        callback(null, null);
                    }
                },

                getTaskExe: ["getMembers", function (callback, results) {
                    var taskExeConditions = {
                        task: task._id
                    };
                    if (classIds) {
                        var members = results.getMembers;
                        taskExeConditions.user = {$in: members};
                    }
                    TaskExe.find(taskExeConditions)
                        .exec(function (err, taskexe) {
                            if (err) return callback(err);
                            callback(null, taskexe);
                        })
                }],
                getMyAnswer: ["getTaskExe", function (callback, results) {
                    var myAnswers = _.map(results.getTaskExe, "myAnswers");
                    var myAnswerIds = [];
                    _.each(myAnswers, function (myansws) {
                        _.each(myansws, function (item) {
                            myAnswerIds.push(item);
                        })
                    })

                    MyAnswer.find({_id: {$in: myAnswerIds}})
                        .populate('topic', '_id knowledge')
                        .exec(function (err, docs) {
                            var options = {
                                path: 'topic.knowledge',
                                select: '_id title level parent',
                                model: 'Knowledge'
                            };

                            if (err) return callback(err);
                            MyAnswer.populate(docs, options, function (err, myanswers) {
                                if (err) return callback(err);
                                callback(null, myanswers);
                            });
                        });
                }],
                getKonwledges: ["getTaskExe", function (callback, results) {
                    // 某次作业的多个taskexe里面，每个topics是一样的，只需要取其中一个就可以
                    var topics = (results.getTaskExe && results.getTaskExe[0] && results.getTaskExe[0].topics) || [];
                    var topicIds = [];
                    _.each(topics, function (item) {
                        topicIds.push(mongoose.Types.ObjectId(item));
                    })
                    Topic.find({_id: {$in: topicIds}})
                        .select('_id knowledge')
                        .populate('Knowledge', '_id title level parent')
                        .exec(function (err, topics) {
                            if (err) return callback(err);
                            callback(null, topics);
                        })
                }],
                rightRateOfKnowledge: ['getMyAnswer', function (callback, results) {
                    // 获取该次作业中各个知识点的个数统计
                    var topicKnowledges = results.getKonwledges;
                    var konwledgeCountByAry = [];
                    _.each(topicKnowledges, function (topicKnows) {
                        _.each(topicKnows.knowledge, function (item) {
                            konwledgeCountByAry.push(item.toString());
                        })
                    })

                    var konwledgeCountby = _.countBy(konwledgeCountByAry);

                    //以下为获取myAnswer中各知识点的正确个数
                    var knowledgeArray = [];
                    var answers = results.getMyAnswer;

                    for (var i = 0, answersLen = answers.length; i < answersLen; i++) {
                        var topicKnowledges = answers[i].topic.knowledge;
                        var status = answers[i].status;
                        var mark = answers[i].mark;

                        for (var j = 0, knowledgeLen = topicKnowledges.length; j < knowledgeLen; j++) {
                            var konwledge = topicKnowledges[j];
                            var objKnowledge = konwledge.toObject();

                            var knowledgeIndex = _.findIndex(knowledgeArray, ['_id', konwledge._id]);
                            if (knowledgeIndex < 0) {
                                if (status === '已批改' && mark === '对') {
                                    objKnowledge.right = (objKnowledge.right || 0) + 1;
                                }
                                knowledgeArray.push(objKnowledge);
                            } else {
                                if (status === '已批改' && mark === '对') {
                                    knowledgeArray[knowledgeIndex].right = ((knowledgeArray[knowledgeIndex].right || 0
                                            ) ||
                                            0
                                        )
                                        + 1;
                                }
                            }
                        }
                    }

                    // 最后统计各知识点正确率(只统计myanswer里面的知识点)
                    for (var i = 0, len = knowledgeArray.length; i < len; i++) {
                        var knowledgePick = _.pick(konwledgeCountby, [knowledgeArray[i]._id]);
                        if (knowledgePick) {
                            var knowledgeCount = knowledgePick[knowledgeArray[i]._id] * acceptersLen; // 乘以作业分配人数
                            knowledgeArray[i].rightRate = Math.round(knowledgeArray[i].right / knowledgeCount * 100);
                        }
                    }

                    callback(null, knowledgeArray);
                }]
            }, function (err, results) {
                if (err) return res.status(500).send({result: 0, data: '数据库操作错误'});

                var rightRateOfKnowledge = results.rightRateOfKnowledge;
                return res.json({result: 1, data: rightRateOfKnowledge});
            });
        },

        /**
         * list teacher tasks
         */
        teacherTasks: function (req, res) {
            var page = req.query.page ? parseInt(req.query.page) : 1;
            var pageItem = req.query.pageItem ? parseInt(req.query.pageItem) : 20;
            var query = {'from.userId': req.user._id.toString()};
            if (req.query.class) {
                query['type'] = 'class';
                query['to.name'] = req.query.class;
            }
            if (req.query.grade) {
                query['to.grade'] = req.query.grade;
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
                    .populate('content.book', "_id name grade subject session cover", 'TeacherBook')
                    .exec(function (err, results) {
                        callback(err, results);
                    });
            }], function (err, results) {
                if (err) return res.status(500).send("数据库操作错误");
                return res.json({
                    result: 1,
                    data: {count: results[0], list: results[1], page: page, pageItem: pageItem}
                });
            })

        },

        /**
         * list checker tasks
         */
        checkerTasks: function (req, res) {
            var page = req.query.page ? parseInt(req.query.page) : 1;
            var pageItem = req.query.pageItem ? parseInt(req.query.pageItem) : 20;
            var query = {'checkers.userId': req.user._id};

            if (req.query.status) {
                if (req.query.status === '已批改') {
                    query['checkers.status'] = req.query.status;
                } else {
                    query['checkers.status'] = {$ne: '已批改'};
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
                    .populate('checkers.content.book', "_id name grade subject session cover", 'TeacherBook')
                    .populate('checkers.userId', '_id name username')
                    .exec(function (err, results) {
                        callback(err, results);
                    });
            }], function (err, results) {
                if (err) return res.status(500).send("数据库操作错误");
                return res.json({
                    result: 1,
                    data: {count: results[0], list: results[1], page: page, pageItem: pageItem}
                });
            })

        },

        /**
         * 任务题目及作答
         */
        taskTopicsCheck: function (req, res) {
            var topicIds = [], userIds = [];
            if (req.query.topicId) {
                topicIds = [req.query.topicId];
            } else {
                topicIds = req.task.content.topics;
            }
            if (topicIds.length === 0) return res.status(400).send('没有题目');
            var classId = req.query.classId;
            async.parallel([
                function (callback) {
                    //get userIds
                    if (!classId || (req.task.to && req.task.to.length === 1 && req.task.to[0].classId === classId)) {
                        return callback(null, req.task.accepters);
                    } else if (classId) {
                        var Klass = mongoose.model('Cclass');
                        Klass.load(classId, function (err, result) {
                            if (err) return callback(err);
                            if (!result) return callback('班级不存在');
                            var memberIds = [];
                            _.each(result.members, function (item) {
                                memberIds.push(item.userId);
                            });
                            var accepters = [];
                            _.each(req.task.accepters, function (item) {
                                if (memberIds.indexOf(item) !== -1) {
                                    accepters.push(item);
                                }
                            });
                            return callback(null, accepters);
                        });
                    } else {
                        return callback('不存在');
                    }

                },
                function (callback) {
                    //题目列表
                    var Topic = mongoose.model('Topic');
                    Topic.find({_id: {$in: topicIds}}, function (err, results) {
                        if (err) return callback(err);
                        return callback(null, results);
                    });
                }
            ], function (err, results) {
                if (err) return res.status(400).send(err);
                var userIds = results[0];
                var topics = results[1];
                if (!userIds || userIds.length === 0) {
                    return res.json({result: 1, data: {count: topics.length, list: topics}});
                }
                var getMyAnswerFuns = [];
                var newTopics = [];
                _.each(topics, function (item) {
                    getMyAnswerFuns.push(function (callback) {
                        checkTopicAnswer(item._id, userIds, function (err, results) {
                            var ob = item.toObject();
                            //每题回答统计
                            var statistics = {submitters: 0, checked: 0, rightRate: 0, completed: false};
                            if (results && results.length > 0) {
                                var submitters = 0, checked = 0, rights = 0;
                                _.each(results, function (sub) {
                                    submitters++;
                                    if (sub.status === '已批改') {
                                        checked++;
                                        if (sub.mark === '对') {
                                            rights++;
                                        }
                                    }
                                });
                                var rightRate = checked ? Math.round(rights / checked * 100) : 0;
                                var advices = common.getAdvices(rightRate);
                                var completed = (submitters == checked) ? true : false;
                                statistics = {
                                    submitters: submitters,
                                    checked: checked,
                                    rightRate: rightRate,
                                    completed: completed,
                                    advices: advices
                                };
                            }
                            ob.myAnswers = results || null;
                            ob.statistics = statistics;
                            newTopics.push(ob);
                            callback();
                        });
                    })
                });
                async.parallel(getMyAnswerFuns, function (err, results) {
                    if (err) return res.status(400).send(err);
                    if (newTopics.length > 1) {
                        newTopics.sort(function (a, b) {
                            return topicIds.indexOf(a._id.toString()) - topicIds.indexOf(b._id.toString());
                        });
                    }
                    return res.json({result: 1, data: {count: newTopics.length, list: newTopics}});
                });

            });
        },

        /**
         * 考试题目及作答
         */
        examTaskTopicsCheck: function (req, res) {
            var checker = _.find(req.task.checkers, {userId: req.user._id});

            var topicIds = [];
            if (req.query.topicId) {
                topicIds = [req.query.topicId];
            } else {
                topicIds = checker.content.topics;
            }
            if (topicIds.length === 0) return res.status(400).send('没有题目');

            async.parallel([
                function (callback) {
                    //get userIds
                    return callback(null, checker.accepters);
                },
                function (callback) {
                    //题目列表
                    var Topic = mongoose.model('Topic');
                    Topic.find({_id: {$in: topicIds}}, function (err, results) {
                        if (err) return callback(err);
                        return callback(null, results);
                    });
                }
            ], function (err, results) {
                if (err) return res.status(400).send(err);
                var userIds = results[0];
                var topics = results[1];
                if (!userIds || userIds.length === 0) {
                    return res.json({result: 1, data: {count: topics.length, list: topics}});
                }
                var getMyAnswerFuns = [];
                var newTopics = [];
                _.each(topics, function (item) {
                    getMyAnswerFuns.push(function (callback) {
                        checkTopicAnswer(item._id, userIds, function (err, results) {
                            var ob = item.toObject();
                            //每题回答统计
                            var statistics = {submitters: 0, checked: 0, rightRate: 0, completed: false, avgScore: 0};
                            if (results && results.length > 0) {
                                var submitters = 0, checked = 0, rights = 0, totalScore = 0;
                                _.each(results, function (sub) {
                                    submitters++;
                                    if (sub.status === '已批改') {
                                        checked++;
                                        if (sub.mark === '对') {
                                            rights++;
                                        }
                                        if (sub.score && _.toNumber(sub.score)) {
                                            totalScore = totalScore + _.toNumber(sub.score);
                                        }
                                    }
                                });
                                var rightRate = checked ? Math.round(rights / checked * 100) : 0;
                                var advices = common.getAdvices(rightRate);
                                var completed = (submitters == checked) ? true : false;
                                var avgScore = submitters ? Math.round(totalScore / submitters) : 0;
                                statistics = {
                                    submitters: submitters,
                                    checked: checked,
                                    rightRate: rightRate,
                                    completed: completed,
                                    advices: advices,
                                    avgScore: avgScore      // 新增平均得分
                                };
                            }
                            ob.myAnswers = results || null;
                            ob.statistics = statistics;
                            newTopics.push(ob);
                            callback();
                        });
                    })
                });
                async.parallel(getMyAnswerFuns, function (err, results) {
                    if (err) return res.status(400).send(err);
                    if (newTopics.length > 1) {
                        newTopics.sort(function (a, b) {
                            return topicIds.indexOf(a._id.toString()) - topicIds.indexOf(b._id.toString());
                        });
                    }
                    return res.json({result: 1, data: {count: newTopics.length, list: newTopics}});
                });

            });
        },

        /**
         * list student tasks
         */
        studentTasks: function (req, res) {
            var page = req.query.page ? parseInt(req.query.page) : 1;
            var pageItem = req.query.pageItem ? parseInt(req.query.pageItem) : 20;
            var userId=req.query.userId || req.user._id.toString();
            var query = {'accepters': userId};
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
                var selfId = userId;
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

        },
        /**
         * list schooler tasks
         */
        schoolerTasks: function (req, res) {
            var page = req.query.page ? parseInt(req.query.page) : 1;
            var pageItem = req.query.pageItem ? parseInt(req.query.pageItem) : 20;
            var query = {};
            if (req.query.class) {
                query['type'] = 'class';
                query['to.name'] = req.query.class;
            }
            if (req.query.contentType) {
                query['content.type'] = req.query.contentType;
            }
            if (req.query.grade) {
                query['to.grade'] = req.query.grade;
            }
            if (req.query.status) {
                if (req.query.status === '已批改') {
                    query['status'] = req.query.status;
                } else {
                    query['status'] = {$ne: '已批改'};
                }

            }
            async.series([
                function (callback) {
                    //find schoolId
                    var School = mongoose.model('School');
                    var schoolName = req.user.profile.school;
                    if (schoolName) {
                        schoolName = schoolName.split(',');
                    }
                    if (!schoolName || schoolName.length === 0) {
                        query['from.userId'] = req.user._id.toString();
                        return callback(null, null);
                    }
                    School.find({'name': {'$in': schoolName}}, function (err, results) {
                        if (err) return callback('数据库访问失败');
                        if (results.length === 0) {
                            query['from.userId'] = req.user._id.toString();
                            return callback(null, null);
                        }
                        var orArray = [{'from.userId': req.user._id.toString()}];
                        _.each(results, function (item) {
                            orArray.push({
                                'to.schoolId': item._id.toString()
                            })
                        });
                        query['$or'] = orArray;
                        return callback(null, null);
                    });
                },
                function (callback) {
                    Task.count(query, function (err, result) {
                        callback(err, result);
                    });
                }, function (callback) {
                    Task.find(query)
                        .sort({created: -1})
                        .skip((page - 1) * pageItem)
                        .limit(pageItem)
                        // .populate('content.book', "_id name grade subject session cover", 'TeacherBook')
                        .exec(function (err, results) {
                            callback(err, results);
                        });
                }], function (err, results) {
                if (err) return res.status(500).send("数据库操作错误");
                return res.json({
                    result: 1,
                    data: {count: results[1], list: results[2], page: page, pageItem: pageItem}
                });
            })

        },
        /**
         * 提交任务结果
         * @param req
         * @param res
         */
        answerTask: function (req, res) {
            var taskExe;
            async.series([
                function (callback) {
                    //是否已经存在
                    TaskExe.findOne({user: req.user._id, task: req.task._id}, function (err, result) {
                        if (err) return callback(err);
                        if (result) {
                            taskExe = result;
                        } else {
                            taskExe = new TaskExe();
                            taskExe.user = req.user._id;
                            taskExe.task = req.task._id;
                            //set taskExe type by task.content.type
                            if (req.task.content && req.task.content.type) {
                                taskExe.type = req.task.content.type;
                            }
                            taskExe.remark = req.body.remark;
                        }
                        return callback(null, taskExe);
                    });
                },
                function (callback) {
                    //handle uploaded img
                    if (!req.body.exeImgs) return callback(null, 'ok');
                    var imgs = req.body.exeImgs;
                    if (imgs.length > 0) {
                        var common = require("../../../common/server/controllers/index")();
                        var destDir = '/' + req.user._id.toString() + '/';
                        async.each(imgs, function (item, cb) {
                            if (item.exeImg.indexOf('/uploads/') === -1) return cb();
                            taskExe.status = '系统批改中';
                            common.moveUpload(item.exeImg, destDir, function (err, result) {
                                if (err) return cb(err);
                                item.exeImg = result.url;
                                item.path = result.local;
                                item.width = result.width;
                                item.height = result.height;
                                return cb(err, result);
                            });
                        }, function (err) {
                            if (err) return callback(err);
                            req.body.exeImgs = imgs;
                            taskExe.exeImg = imgs;
                            return callback(null, 'ok');
                        });
                    } else {
                        return callback(null, 'ok');
                    }


                }, function (callback) {
                    //get topics
                    if (!taskExe.topics || taskExe.topics.length === 0) {
                        taskExe.topics = [];
                        _.each(req.task.content.topics, function (item) {
                            if (item && typeof (item) === 'string') {
                                taskExe.topics.push(mongoose.Types.ObjectId(item));
                            }
                        });
                    }
                    return callback(null, 'ok');


                }, function (callback) {
                    //get myAnswers and statistics
                    var MyAnswer = mongoose.model('MyAnswer');
                    MyAnswer.find({user: req.user._id, topic: {$in: taskExe.topics}}, function (err, results) {
                        if (err) return callback(err);
                        if (results && results.length > 0) {
                            var arr = [];
                            var rightNum = 0, markNum = 0;
                            var totalScore = 0;
                            _.each(results, function (item) {
                                arr.push(item._id);
                                if (item.status === '已批改') markNum += 1;
                                if (item.mark === '对') rightNum += 1;
                                if (item.score && _.toNumber(item.score)) {
                                    totalScore = totalScore + _.toNumber(item.score);
                                }
                            });
                            taskExe.myAnswers = arr;
                            //var rightRate = markNum ? Math.round(rightNum / markNum * 100) : 0;
                            var rightRate = Math.round(rightNum / (taskExe.topics.length || 1) * 100);
                            var advices = common.getAdvices(rightRate);
                            taskExe.statistics = {
                                total: taskExe.topics.length,
                                time: Date.now(),
                                mark: markNum,
                                right: rightNum,
                                rightRate: rightRate,
                                advices: advices,
                                totalScore: totalScore  // 新增统计考试总分值
                            };
                            return callback(null, arr);
                        } else {
                            taskExe.myAnswers = [];
                            return callback();
                        }
                    });

                }], function (err, results) {
                if (err) return res.status(400).send('提交作业失败');
                var isNew = taskExe.isNew;
                if (taskExe.isNew) {
                    //get submitOrder
                    req.task.executed = req.task.executed || [];
                    taskExe.submitOrder = req.task.executed.length;
                }
                taskExe.save(function (err, result) {
                    if (err) return res.status(400).send('提交作业失败');
                    var funs = [];
                    if (taskExe.exeImg && taskExe.exeImg.length > 0) {
                        var TaskImg = mongoose.model('TaskImg');
                        _.each(taskExe.exeImg, function (item) {
                            funs.push(function (cb) {
                                var taskImg = new TaskImg();
                                taskImg.task = req.task._id;
                                taskImg.taskExe = taskExe._id;
                                taskImg.user = req.user._id;
                                taskImg.originalImg = item.exeImg;
                                taskImg.originalImgPath = item.path;
                                taskImg.pageNum = item.page;
                                taskImg.pageImg = item.pageImg;
                                taskImg.save(function (err) {
                                    if (err) return cb('数据库操作失败' + item.exeImg);
                                    //add to recognize handle queue
                                    var imgRecognizeQueue = app.get('imgRecognizeQueue');
                                    if (imgRecognizeQueue) {
                                        console.log("add to imgRecognizeQueue");
                                        imgRecognizeQueue.add({taskImg: taskImg});
                                    }
                                    cb(null, 'ok');
                                });
                            });
                        });
                    }
                    funs.push(function (cb) {
                        if (!isNew) return cb(null, 'ok');
                        var executed = req.task.executed;
                        executed.push(taskExe._id);
                        req.task.executed = executed;
                        req.task.save(function (err) {
                            if (err) return cb('数据库操作失败');
                            cb(null, taskExe);
                        });
                    });
                    async.series(funs, function (err) {
                        if (err) return res.status(500).send(err);

                        //  孩子提交作业后通知家长功能
                        var noti_Options = {
                            teacherName: req.task.from.name,
                            teacherUserId: req.task.from.userId,
                            taskTitle: req.task.title,
                            notiTitle: '您的孩子有一新作业已提交',
                            children: req.user._id.toString()
                        }
                        parents.notificationFromTask(noti_Options);

                        res.json({result: 1, data: taskExe});
                    });
                });
            })
        },
        /**
         * task executor
         * @param req
         * @param res
         * @param next
         * @param id
         */
        taskExe: function (req, res, next, id) {
            TaskExe.load(id, function (err, taskExe) {
                if (err) return res.status(500).send('数据库操作失败');
                if (!taskExe) {
                    return res.status(400).send('没有找到');
                }
                req.taskExe = taskExe;
                next();
            });
        },
        findTaskExe: function (req, res) {
            TaskExe.findOne({_id: req.taskExe._id})
                .populate('user')
                .populate('task')
                .populate('topics', {}, 'Topic')
                .populate('myAnswers')
                .exec(function (err, result) {
                    result = result.toObject();
                    var myAnswers = result.myAnswers;
                    if (result.topics) {
                        _.each(result.topics, function (item) {
                            var ianswer = _.find(myAnswers, {topic: item._id});
                            if (ianswer) {
                                item.done = true;
                                item.myAnswer = ianswer;
                            }
                        });
                    }
                    result.myAnswers = [];
                    return res.json({result: 1, data: result});
                });

        },
        findTaskExeResource: function (req, res) {
            TaskExe.findOne({_id: req.taskExe._id})
                .select('statistics task topics')
                .populate('task', ' _id content ')
                .exec(function (err, result) {
                    if (err) return res.json({result: 0, data: err});
                    var objResult = result.toObject();
                    //find resource
                    async.parallel([
                        function (callback) {
                            //出版社及老师上传资源
                            var resources = [];
                            if (result && result.task && result.task.content && result.task.content.resources) {
                                resources = result.task.content.resources;
                            }
                            var resourceObjectIds = [];
                            _.each(resources, function (resource) {
                                resourceObjectIds.push(mongoose.Types.ObjectId(resource));
                            })
                            Resource.find({_id: {$in: resourceObjectIds}})
                                .populate('knowledge', '_id title parent level')
                                .exec(function (err, rs) {
                                    callback(err, rs);
                                });
                        },
                        function (callback) {
                            //根据知识点自动匹配
                            if (!objResult.topics || objResult.topics.length === 0) return callback(null, []);
                            Topic.find({_id: {$in: objResult.topics}})
                                .populate('knowledge', '_id title parent level')
                                .exec(function (err, results) {
                                    if (err) return callback(err);
                                    var knowledges = [];
                                    _.each(results, function (item) {
                                        knowledges = _.unionBy(knowledges, item.knowledge, '_id');
                                    });
                                    //get resources by knowledge
                                    resourcesByKnowledge(knowledges, function (err, results) {
                                        callback(err, results);
                                    });
                                });
                        }
                    ], function (err, results) {
                        if (err) return res.json({result: 0, data: err});
                        objResult.resources = results[0];
                        var otherResources = results[1];
                        if (_.isArray(otherResources) && otherResources.length > 0) {
                            _.each(otherResources, function (item) {
                                if (!_.find(objResult.resources, {_id: item._id})) {
                                    objResult.resources.push(item);
                                }
                            });
                        }
                        return res.json({result: 1, data: objResult});
                    });

                });
        },
        updateTaskExe: function (req, res) {
            if (req.body.remark) {
                req.taskExe.remark = req.body.remark;
            }
            if (req.body.comment) {
                req.taskExe.comments = req.taskExe.comments || [];
                req.taskExe.comments.push(req.body.comment);
            }
            req.taskExe.save(function (err) {
                if (err) return res.status(500).send("数据库访问失败");

                if (req.body.comment) {
                    var notification = {
                        title: '您有一新的作业点评',
                        content: '请进入作业查看',
                        link: {
                            taskExeId: req.taskExe._id
                        },
                        from: {
                            name: req.body.comment.username,
                            userId: req.body.comment.userId
                        },
                        to: req.taskExe.user._id.toString()
                    };
                    app.get('notificationEvent').emit('notification_multiple', notification);
                }

                return res.json({result: 1, data: null});
            });
        },
        updateAllStatus: function (req, res) {
            var taskExeIds = req.body.taskExeIds || [];
            var fnTasks = [];
            TaskExe.find({_id: {$in: taskExeIds}})
                .exec(function (err, results) {
                    if (err) return res.status(500).send("数据库访问失败");

                    for (var i = 0; i < results.length; i++) {
                        fnTasks.push(
                            (function (taskexe) {
                                return function (callback) {
                                    if (taskexe.status === "已批改") {
                                        return callback(null, taskexe);
                                    }
                                    taskexe.status = "已批改";
                                    taskexe.save(function (err) {
                                        if (err) return callback(err);
                                        callback(null, taskexe);
                                    });
                                }
                            })(results[i])
                        );
                    }

                    async.parallel(fnTasks, function (err, results) {
                        if (err) return res.status(500).send("数据库访问失败");
                        return res.json({result: 1, data: results});
                    })
                });
        }
    }
};