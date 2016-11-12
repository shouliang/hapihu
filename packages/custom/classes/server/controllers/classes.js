'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Cclass = mongoose.model('Cclass'),
    School = mongoose.model('School'),
    User = mongoose.model('User'),
    app = require('meanio').app,
    _ = require('lodash'),
    async = require('async');

module.exports = function () {

    return {
        /**
         * Find cclass by id
         */
        cclass: function (req, res, next, id) {
            Cclass.load(id, function (err, cclass) {
                if (err) return next(err);
                if (!cclass) return res.status(400).send('未找到班级' + id);
                req.cclass = cclass;
                next();
            });
        },
        /**
         * Create an cclass by user
         */
        create: function (req, res) {
            var klassOb = req.body.klass;
            if (!klassOb || !klassOb.schoolId || !klassOb.name || !klassOb.grade) {
                return res.status(400).send('缺少参数');
            }
            School.load(klassOb.schoolId, function (err, school) {
                if (err) return res.status(500).send('操作数据库失败');
                if (!school) return res.status(400).send('学校不存在');
                var conditions = {
                    name: klassOb.name,
                    grade: klassOb.grade,
                    school: school
                };
                Cclass.findOne(conditions, function (err, klass) {
                    if (err) return res.status(500).send('操作数据库失败');
                    if (klass) return res.status(400).send('此班级已经存在');
                    async.waterfall([
                        function (callback) { //get ccid and ccode
                            var zoneCode = school.postcode && school.postcode.length > 0 ? school.postcode[school.postcode.length - 1] : '000001';
                            var reg = new RegExp("^" + zoneCode, 'g');
                            var cids = [];
                            Cclass.find({cid: reg}, {cid: 1}, function (err, results) {
                                if (err) return callback("无法生成cid");
                                _.each(results, function (item) {
                                    cids.push(item.cid);
                                });
                                var getRandomNumString = function (len) {
                                    if (!len) return null;
                                    var max = Math.pow(10, len);
                                    var rand = Math.floor(Math.random() * max);
                                    rand = rand.toString();
                                    var result = '';
                                    if (rand.length < len) {
                                        for (var i = 0; i < len - rand.length; i++) {
                                            result += '0';
                                        }

                                    }
                                    result += rand;
                                    return result;
                                }
                                var latestCcode = getRandomNumString(4);
                                var i = 0;
                                //此处留有隐患，当某地区班级太多时，可能导致无法建立新班级
                                while (cids.indexOf(zoneCode + latestCcode) > -1) {
                                    i++;
                                    if (i > 200) return callback("无法生成新cid");
                                    latestCcode = getRandomNumString(4);
                                }
                                callback(null, zoneCode, latestCcode);
                            });
                        }
                    ], function (err, zoneCode, latestCcode) {
                        if (err) return res.status(500).send("生成新cid失败");
                        klass = new Cclass();
                        klass.name = klassOb.name;
                        klass.grade = klassOb.grade;
                        klass.school = school;
                        klass.user = req.user;
                        klass.status = 'unconfirmed';
                        //if teacher or student ,add to class ,or add to admins
                        if(['teacher','student'].indexOf(req.user.userType)!==-1){
                            klass.members = [{
                                userId: req.user._id.toString(),
                                userType: req.user.userType,
                                username: req.user.username,
                                name: req.user.name,
                                status: '审核成功'
                            }];
                        }else{
                            klass.admins = [req.user._id.toString()];
                        }
                        klass.cid = zoneCode + latestCcode;
                        klass.ccode = latestCcode;

                        klass.save(function (err) {
                            if (err) return res.status(500).send('班级创建失败');
                            async.parallel([function (callback) {
                                //add class to school
                                if(klassOb.type==='train'){
                                    school.classes = school.classes || [];
                                    school.classes.push({
                                        grade: klass.grade,
                                        classId: klass._id.toString(),
                                        name: klass.name,
                                        subject:klassOb.subject,
                                        status:klassOb.status
                                    });
                                }else{
                                    school.tmpClasses = school.tmpClasses || [];
                                    school.tmpClasses.push({
                                        grade: klass.grade,
                                        classId: klass._id.toString(),
                                        name: klass.name
                                    });
                                }

                                school.save(function (err) {
                                    callback(err)
                                });
                            }, function (callback) {
                                //add class to user.profile.classes
                                req.user.profile.classes = req.user.profile.classes || [];
                                req.user.profile.classes.push({
                                    name: klass.name,
                                    classId: klass._id.toString(),
                                    status: '审核成功'
                                });
                                req.user.markModified('profile.classes');
                                req.user.save(function (err) {
                                    callback(err)
                                });
                            }], function (err, results) {
                                if (err) {
                                    console.log("add classes err:", err);
                                    return res.status(500).send('添加班级错误');
                                }
                                return res.json({result: 1, data: klass});
                            });


                        });
                    });

                });
            });

        },
        /**
         * update class base info
         */
        update: function (req, res) {
            var newKlass = req.body;
            var klass = req.cclass;
            if (newKlass.name === klass.name && newKlass.status === klass.status) {
                return res.json({result: 1, data: klass});
            }
            var change = {};
            change.status = (klass.status === newKlass.status) ? false : true;
            change.name = (klass.name === newKlass.name || !newKlass.name) ? false : true;
            if (change.name) {
                klass.name = newKlass.name;
            }
            if (change.status) {
                klass.status = newKlass.status;
            }
            klass.save(function (err, result) {
                if (err) return res.status(500).send("数据库操作失败");
                if (change.status) {
                    var school = klass.school;
                    var newClass = {name: klass.name, classId: klass._id.toString(), grade: klass.grade};
                    if (klass.status === 'confirmed') {
                        var iclass = _.remove(klass.school.tmpClasses, {'classId': klass._id.toString()});
                        if (iclass) {
                            school.markModified('tmpClasses');
                        }
                        var igrade = _.find(klass.school.grades, {name: klass.grade});
                        if (igrade) {
                            iclass = _.remove(igrade.classes, {'classId': klass._id.toString()});
                            igrade.classes.push(newClass);
                        } else {
                            var defaultGrades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三'];
                            igrade = {
                                name: klass.grade,
                                classes: [newClass]
                            };
                            var insertIndex = _.sortedIndexBy(klass.school.grades, igrade, function (item) {
                                return defaultGrades.indexOf(item.name);
                            });
                            klass.school.grades.splice(insertIndex, 0, igrade);

                        }
                        school.markModified('grades');

                    } else if (klass.status === 'unconfirmed') {

                        var igrade = _.find(klass.school.grades, {name: klass.grade});
                        if (igrade) {
                            var iclass = _.remove(igrade.classes, {'classId': klass._id.toString()});
                            if (iclass) {
                                school.markModified('grades');
                            }
                        }
                        school.tmpClasses.push(newClass);
                        school.markModified('tmpClasses');

                    }
                    school.save(function (err) {
                        if (err) return res.status(400).send("更新学校失败");
                        return res.json({result: 1, data: klass});
                    });
                    return;
                }
                return res.json({result: 1, data: klass});
            });
        },
        /**
         * update class base info
         */
        delete: function (req, res) {
            var klass=req.cclass;
            var classId=klass._id;
            var schoolId=klass.school;
            async.series([
                function (callback) {
                    //delete class in school
                    if(schoolId){
                        School.findOne({_id:schoolId},function (err,result) {
                            if(err) return callback('数据库访问失败');
                            if(!result) return callback();
                            var classes=result.classes;
                            var cid=classId.toString();
                            if(classes){
                                _.forEach(classes,function (item) {
                                    if(item && item.classId===cid){
                                        classes.splice(classes.indexOf(item),1);
                                    }
                                });
                                result.classes=classes;
                            }
                            var tempClasses=result.tempClasses;
                            if(tempClasses){
                                _.forEach(tempClasses,function (item) {
                                    if(item && item.classId===cid){
                                        tempClasses.splice(tempClasses.indexOf(item),1);
                                    }
                                });
                                result.tempClasses=tempClasses;
                            }
                            result.markModified('classes');
                            result.markModified('tempClasses');
                            result.save(function (err,result) {
                                if(err) return callback('数据库访问失败');
                                callback();
                            });
                        });
                    }else{
                        callback();
                    }
                },
                function (callback) {
                    //delete class
                    Cclass.remove({_id:classId},function (err,result) {
                        if(err) return callback('数据库访问失败');
                        callback();
                    });
                }
            ],function (error,result) {
                if(error) return res.status(400).send(error);
                res.json({result:1});
            });
        },
        // 直接添加学生
        addMembers: function (req, res) {
            var klass = req.cclass;
            var student = req.body;

            // TODO testData must remove later
            // var student = {
            //     "mobile": "13553521360",
            //     "name": "杨笑",
            //     "username": "666yangxiao666",
            //     "password":'123456',
            //     "userType": "student",
            //     "confirm": "confirmed"
            // }

            User.findOne({username: student.username, userType: 'student'}).exec(function (err, user) {
                if (user) {
                    if (_.findIndex(klass.members || [], {username: user.username}) >= 0) {
                        return res.json({result: 0, data: '该学生已注册'});
                    }

                    klass.members = ( klass.members || []).concat(
                        {
                            userId: user._id,
                            username: user.username,
                            name: user.name,
                            userType: "student",
                            status: "审核成功"
                        });

                    klass.save(function (err, klass) {
                        if (err) return res.json({result: 0, data: '数据库操作错误'});
                        return res.json({result: 1, data: klass});
                    })
                } else {
                    User.create(student, function (err, stu) {
                        if (err) return res.json({result: 0, data: err || '数据库错误'});

                        klass.members = ( klass.members || []).concat(
                            {
                                userId: stu._id,
                                username: stu.username,
                                name: stu.name,
                                userType: "student",
                                status: "审核成功"
                            });

                        klass.save(function (err, klass) {
                            if (err) return res.json({result: 0, data: err || '数据库操作错误'});
                            return res.json({result: 1, data: klass});
                        })
                    })
                }
            })
        },

        /**
         * Update an cclass members
         */
        updateMembers: function (req, res) {
            var cclass = req.cclass;
            var action = req.body.action;
            var userId = req.body.userId;
            var user = req.user;
            var success = false;
            if (action == 'check_member') {
                for (var i = 0; i < cclass.members.length; i++) {
                    if (cclass.members[i].userId == userId) {
                        if (['admin', 'teacher'].indexOf(user.userType) > -1) {
                            cclass.members[i].status = '审核成功';
                            success = true;
                        } else {
                            cclass.members[i].checked = cclass.members[i].checked || [];
                            var iId = user._id.toString();
                            if (cclass.members[i].checked.indexOf(iId) !== -1) {
                                //重复提交
                                return res.status(400).send('你已经审核过');
                            }
                            cclass.members[i].checked.push(iId);
                            if (cclass.members[i].checked.length >= 3 || cclass.members[i].checked.length === cclass.members.length - 1) {
                                cclass.members[i].status = '审核成功';
                                success = true;
                            }
                        }

                        cclass.markModified('members.' + i);
                        break;
                    }
                }
            } else if (action == 'remove_member') {
                for (var i = 0; i < cclass.members.length; i++) {
                    if (cclass.members[i].userId == userId) {
                        if (['admin', 'teacher'].indexOf(user.userType) > -1) {
                            cclass.members.splice(i, 1);
                            success = true;
                        } else {
                            cclass.members[i].unchecked = cclass.members[i].unchecked || [];
                            var iId = user._id.toString();
                            if (cclass.members[i].unchecked.indexOf(iId) !== -1) {
                                //重复提交
                                return res.status(400).send('你已经执行过');
                            }
                            cclass.members[i].unchecked.push(user._id.toString());
                            if (cclass.members[i].unchecked.length >= 5 || cclass.members[i].unchecked.length === cclass.members.length - 1) {
                                cclass.members.splice(i, 1);
                                success = true;
                            }
                        }
                        cclass.markModified('members');
                        break;
                    }
                }
            }
            cclass.save(function (err, klass) {
                if (err) {
                    return res.status(400).send("修改失败");
                }
                //notification to user
                if (success && action == 'check_member') {
                    User.findOne({_id: userId}, function (err, user) {
                        var classes = user.profile.classes;
                        if (classes) {
                            var klassId = klass._id.toString();
                            _.each(classes, function (item) {
                                if (item.classId == klassId) {
                                    item.status = "审核成功";
                                    user.markModified('profile.classes');
                                }
                            });
                            user.save(function (err) {
                                if (err) console.log("update class check_member to user err: ", err);
                            });
                        }

                    });
                    var object = {
                        title: "你已经正式加入【" + klass.name + "】",
                        content: "恭喜你，你已经通过了班级审核，享有此班级的相关权限",
                        from: {name: klass.name},
                        to: userId
                    }
                    app.get('notificationEvent').emit('notification_single', object);
                } else if (success && action == 'remove_member') {
                    User.findOne({_id: userId}, function (err, user) {
                        var classes = user.profile.classes;
                        if (classes) {
                            var klassId = klass._id.toString();
                            _.each(classes, function (item, key) {
                                if (item.classId == klassId) {
                                    classes.splice(key, 1);
                                    user.markModified('profile.classes');
                                }
                            });
                            user.save(function (err) {
                                if (err) console.log("update class remove_member to user err: ", err);
                            });
                        }

                    });
                    var object = {
                        title: "你已经被踢出【" + klass.name + "】",
                        content: "你被认为非班级成员，被踢出班级，如果想重新加入，请重新申请",
                        from: {name: klass.name},
                        to: userId
                    }
                    app.get('notificationEvent').emit('notification_single', object);
                }
                res.json({result: 1, data: klass});
            });
        },
        /**
         * Delete an cclass
         */
        destroy: function (req, res) {
            var cclass = req.cclass;
            cclass.remove(function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the cclass'
                    });
                }
                res.json(cclass);
            });
        },
        /**
         * Show an cclass
         */
        show: function (req, res) {
            res.json({result: 1, data: req.cclass});
        },
        /**
         * List of Cclasss
         */
        all: function (req, res) {
            var conditions = {};
            var ItemInPage = 20;
            if (req.query.status) {
                conditions.status = req.query.status;
            }
            if (req.query.ids) {
                var ids = req.query.ids.split(',');
                if (ids.length > 0) {
                    conditions._id = {$in: ids};
                    ItemInPage = 200;
                }
            }

            ItemInPage = parseInt(req.query.pageItem) ? parseInt(req.query.pageItem) : ItemInPage;
            var page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
            async.parallel([function (callback) {
                Cclass.count(conditions, function (err, result) {
                    callback(err, result);
                });
            }, function (callback) {
                Cclass.find(conditions).skip((page - 1) * ItemInPage).limit(ItemInPage).sort('-created').populate('user', 'name username').populate('school', '_id name').exec(function (err, results) {
                    callback(err, results);
                });
            }], function (err, results) {
                if (err) {
                    res.status(400).json({msg: '查询失败'});
                } else {
                    res.json({
                        status: 200,
                        result: 1,
                        data: {count: results[0], list: results[1], page: page, pageItem: ItemInPage}
                    });
                }
            });
        },
        /**
         * get user classes
         */
        myClasses: function (req, res, next) {
            if (!req.user) return res.status(400).send("你尚未登陆");
            var classes = req.user.profile.classes;
            async.each(classes, function (item, callback) {
                Cclass.load(item.classId, function (err, result) {
                    if (result) {
                        if (item.status.indexOf("成功") > -1) {
                            item.members = result.members;
                        }
                        item.school = result.school;
                        item.grade = result.grade;
                    }
                    callback();
                });

            }, function (err) {
                res.json({result: 1, data: classes});
            });

        },

        /**
         * get user classes
         */
        joinClass: function (req, res, next) {
            req.user.profile.classes = req.user.profile.classes || [];
            if (req.cclass) {
                if (req.body.unjoin) {
                    //退出班级
                    _.each(req.cclass.members, function (item, key) {
                        if (item && item.userId === req.user._id.toString()) {
                            req.cclass.members.splice(key, 1);
                            req.cclass.markModified('members');
                        }
                    });
                    req.cclass.save(function (err) {
                        if (err) res.status(500).send("班级保存失败");
                        for (var i = 0; i < req.user.profile.classes.length; i++) {
                            if (req.user.profile.classes[i].classId === req.cclass._id.toString()) {
                                req.user.profile.classes.splice(i, 1);
                                req.user.markModified('profile.classes');
                                break;
                            }
                        }
                        //save user info
                        req.user.save(function (err) {

                        });
                        return res.json({result: 1, data: null});
                    });

                } else if (req.body.classCode && req.body.classCode.ccode) {
                    //通过 班级验证码加入班级
                    if (req.cclass.ccode === req.body.classCode.ccode) {
                        for (var i = 0; i < req.cclass.members.length; i++) {
                            if (req.cclass.members[i].userId === req.user._id.toString()) {
                                req.cclass.members[i].status = "审核成功";
                                req.cclass.markModified('members.' + i);
                                break;
                            }
                        }
                        req.cclass.save(function (err) {
                            for (var i = 0; i < req.user.profile.classes.length; i++) {
                                if (req.user.profile.classes[i].classId === req.cclass._id.toString()) {
                                    req.user.profile.classes[i].status = "审核成功";
                                    req.user.markModified('profile.classes.' + i);
                                    break;
                                }
                            }
                            //save user info
                            req.user.save();
                            return res.json({result: 1, data: req.cclass});
                        });
                    } else {
                        return res.status(400).send("验证码错误");
                    }
                } else {
                    //申请加入班级
                    var klass = req.cclass;

                    for (var i = 0; i < req.user.profile.classes.length; i++) {
                        if (req.user.profile.classes[i].classId === klass._id.toString()) {
                            return res.status(400).send("已经加入了此班级");
                        }
                    }
                    var userInfo = {
                        name: req.user.name || req.user.username,
                        username: req.user.username,
                        userId: req.user._id.toString(),
                        userType: req.user.userType,
                        status: '等待审核'
                    };
                    klass.members.push(userInfo);
                    klass.markModified('members');
                    klass.save(function (err) {
                        if (err) return res.status(400).send("数据库操作错误");
                        var iklass = {
                            classId: klass._id.toString(),
                            name: klass.name,
                            grade: klass.grade,
                            school: klass.school.name,
                            status: '等待审核'
                        }
                        req.user.profile.classes.push(iklass);
                        req.user.markModified('profile.classes');
                        req.user.save();
                        return res.json({result: 1, data: klass});
                    });

                }
                return;
            } else if (req.body.classCode && req.body.classCode.cid) {
                //通过班级id直接加入班级
                Cclass.findOne({cid: req.body.classCode.cid}).populate('school').exec(function (err, kclass) {
                    if (err) return res.status(400).send("访问数据库出错了");
                    if (kclass) {
                        var userInfo;
                        for (var i = 0; i < kclass.members.length; i++) {
                            if (kclass.members[i].userId === req.user._id.toString()) {
                                userInfo = kclass.members[i];
                                kclass.members[i].status = "审核成功";
                                kclass.markModified('members.' + i);
                                break;
                            }
                        }
                        if (!userInfo) {
                            userInfo = {
                                name: req.user.name || req.user.username,
                                username: req.user.username,
                                userId: req.user._id.toString(),
                                userType: req.user.userType,
                                status: '审核成功'
                            };
                            kclass.members.push(userInfo);
                            kclass.markModified('members');
                        }

                        kclass.save(function (err) {
                            var had = false;
                            for (var i = 0; i < req.user.profile.classes.length; i++) {
                                if (req.user.profile.classes[i].classId === kclass._id.toString()) {
                                    req.user.profile.classes[i].status = "审核成功";
                                    req.user.markModified('profile.classes.' + i);
                                    had = true;
                                    break;
                                }
                            }
                            if (!had) {
                                var iklass = {
                                    classId: kclass._id.toString(),
                                    name: kclass.name,
                                    grade: kclass.grade,
                                    school: kclass.school.name,
                                    status: '审核成功'
                                }
                                req.user.profile.classes.push(iklass);
                                req.user.markModified('profile.classes');
                            }
                            //save user info
                            req.user.save();
                            return res.json({result: 1, data: kclass});

                        });
                        return;
                    } else {
                        return res.status(400).send("验证码错误");
                    }
                });
            } else {
                return res.status(404).send("没有找到");
            }
        },
        /* add one Member From Classes  classes: classId array[{classId:}] ;userObject: {name:xx,userId:xx} */
        addMemberToClasses: function (classIds, userObject, next) {
            // console.log("addMemberToClasses:",classIds,userObject);
            async.each(classIds, function (item, callback) {
                Cclass.load(item.classId, function (err, klass) {
                    if (err) return callback(err);
                    if(!klass)  return callback('班级不存在');
                    var iu = _.find(klass.members, function (i) {
                        return i.userId == userObject.userId;
                    });
                    if (!iu) {
                        klass.members.push(userObject);
                        klass.save(function (err) {
                            if (err) return callback(err);
                            callback(null);
                        });
                    } else {
                        callback(null);
                    }

                });
            }, function (err) {
                if (err) return next(err);
                console.log("addMemberToClasses err:", err);

                if (next) next(err);
            });
        },
        /* remove one Member From Classes  classes: classId array[{classId:}] ;userObject: {name:xx,userId:xx} */
        removeMemberFromClasses: function (classIds, userObject, next) {
            // console.log("removeMemberFromClasses:",classIds,userObject);
            async.each(classIds, function (item, callback) {
                Cclass.load(item.classId, function (err, klass) {
                    if (err) return callback(err);
                    if(!klass)  return callback('班级不存在');
                    if (klass.members.length > 0) {
                        _.each(klass.members, function (item, key) {
                            if (item.userId == userObject.userId) {
                                klass.members.splice(key, 1);
                            }
                        });
                        // console.log("klass:",klass);
                        klass.save(function (err) {
                            if (err) return callback(err);
                            callback(null);
                        });
                    } else {
                        callback(null);
                    }

                });
            }, function (err) {
                console.log("removeMemberFromClasses err:", err);
                if (next) next(err);
            });
        },

    };
}