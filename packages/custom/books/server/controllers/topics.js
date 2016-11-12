'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Topic = mongoose.model('Topic'),
    MyAnswer = mongoose.model('MyAnswer'),
    Book = mongoose.model('Book'),
    config = require('meanio').loadConfig(),
    _ = require('lodash'),
    fs = require('fs'),
    async = require('async');
var dateFormat = require('dateformat');
var TaskExe = mongoose.model('TaskExe');
var sanitizeHtml = require('sanitize-html');
var common = require("../../../common/server/controllers/index")();

//查询是否已经回答过 topicIds ; id or ids array
var checkTopicAnswer = function (topicIds, userId, next) {
    if (!_.isArray(topicIds)) {
        topicIds = [topicIds];
    }
    _.each(topicIds, function (item) {
        if (typeof (item) === 'string') {
            item = mongoose.Types.ObjectId(item);
        }
    });
    if (typeof (userId) === 'string') {
        userId = mongoose.Types.ObjectId(userId);
    }
    MyAnswer.find({topic: {$in: topicIds}, user: userId}, function (err, results) {
        next(err, results);
    });
};
module.exports = function (Topics) {
    var getNodeByPath = function (book, path) {
        if (!book || !path) return null;
        if (typeof (path) == "string" || typeof (path) == "number") {
            path = [path];
        }
        var tnode = book;
        var setElement = "";
        for (var i = 0; i < path.length; i++) {
            if (tnode.nodes[path[i]]) {
                tnode = tnode.nodes[path[i]];
            } else {
                break;
            }
            if (i > 0) {
                setElement += '.';
            }
            setElement += "nodes." + path[i].toString();
        }
        return {key: setElement, value: tnode};
    };
    return {
        /**
         * Find topic by id
         */
        topic: function (req, res, next, id) {
            Topic.load(id, function (err, topic) {
                if (err) return next(err);
                if (!topic) return next(new Error('Failed to load topic ' + id));
                req.topic = topic;
                next();
            });
        },
        /*
         handle image,move them from temp to topic directory

         */
        handleImg: function (req, res, next) {
            //建立书的文件夹
            var companyPath = '';
            if (req.user.isAdmin) {
                companyPath = 'admin';
            } else if (req.user.profile.companyObject && req.user.profile.companyObject.path) {
                companyPath = req.user.profile.companyObject.path;
            } else {
                return res.status(400).send("请先加入公司");
            }
            var companyDir = config.root + '/' + config.dataDir + '/' + companyPath;
            var topicPath = companyDir + '/';
            var topicUrl = "/" + companyPath + "/";
            if (req.body.from && req.body.from.bookId) {
                topicPath += req.body.from.bookId;
                topicUrl += req.body.from.bookId;
            } else {
                var subDir = dateFormat(new Date(), "yyyy_mm") + "";
                topicPath += subDir;
                topicUrl += subDir;
            }
            async.waterfall([function (callback) {
                fs.exists(companyDir, function (exist) {
                    callback(null, exist);
                });
            }, function (exist, callback) {
                if (!exist) {
                    fs.mkdir(companyDir, function (result) {
                        if (result >= 0) {
                            fs.mkdir(topicPath, function (result) {
                                if (result >= 0) {
                                    callback(null, 'done');
                                } else {
                                    callback('建立目录失败', null);
                                }
                            });
                        } else {
                            callback('建立目录失败', null);
                        }
                    });
                } else {
                    fs.exists(topicPath, function (exist) {
                        if (!exist) {
                            fs.mkdir(topicPath, function (result) {
                                if (result >= 0) {
                                    callback(null, 'done');
                                } else {
                                    callback('建立目录失败', null);
                                }
                            });
                        } else {
                            callback(null, 'done');
                        }
                    });

                }
            }, function (arg, callback) {
                var moveImg = function (str) {
                    var reg = /<img.*?src=['"](\/uploads\/\S+?)['"].*?>/gi;
                    str = str.replace(reg, function (match, capture) {
                        var uploadImg = config.root + "/" + config.dataDir + capture;
                        var imgName = capture.split(/\//);
                        imgName = imgName[imgName.length - 1];
                        if (imgName) {
                            if (fs.existsSync(uploadImg)) {
                                var toImg = topicPath + '/' + imgName;
                                try {
                                    var handleCover = fs.renameSync(uploadImg, toImg);
                                } catch (err) {
                                    return callback("封面处理失败");
                                }
                                if (handleCover) {
                                    callback("封面处理失败");
                                }
                            }
                            return match.replace(capture, topicUrl + "/" + imgName);
                        }
                    });
                    return str;
                };
                if (req.body.stem) {
                    req.body.stem = moveImg(req.body.stem);
                }
                if (req.body.analysis) {
                    req.body.analysis = moveImg(req.body.analysis);
                }
                callback(null, "done");
            }], function (err, result) {
                if (err) {
                    next();
                } else {
                    //更新topic
                    next();
                }

            });
        },
        /**
         * Create an topic
         */
        create: function (req, res) {
            if (req.body.tags && typeof (req.body.tags) == "string") {
                req.body.tags = req.body.tags.split(/\s+/);
            }
            if (req.body.from) {
                req.body.to = [req.body.from];
            }
            var topic = new Topic(req.body);
            topic.user = req.user;
            topic.save(function (err) {
                if (err) {
                    return res.status(500).send("内容添加错误");
                }
                // add topic to book
                if (req.body.from && req.body.from.bookId && req.body.from.path !== undefined) {
                    Book.load(req.body.from.bookId, function (err, book) {
                        if (err || !book) {
                            return res.json({status: 200, result: 1, message: "指定书不存在", data: topic});
                        }

                        var path = req.body.from.path;
                        if (typeof (path) == "string" || typeof (path) == "number") {
                            path = [path];
                        }
                        var updated = book.updated || [];
                        var tnode = book;
                        var setElement = "";
                        for (var i = 0; i < path.length; i++) {
                            if (tnode.nodes[path[i]]) {
                                tnode = tnode.nodes[path[i]];
                            } else {
                                break;
                            }
                            if (i > 0) {
                                setElement += '.';
                            }
                            setElement += "nodes." + path[i].toString();
                        }
                        if (!tnode.topics) {
                            tnode.topics = [];
                        }
                        tnode.topics.push(topic._id);
                        var updatedInfo = {
                            time: Date.now(),
                            type: 'addTopic',
                            operation: '添加新题：【' + tnode.title + '】'
                        }
                        updated.push(updatedInfo);
                        if (updated.length > 100) {
                            updated.shift();
                        }
                        var setOb = {};
                        setOb[setElement] = tnode;
                        setOb['updated'] = updated;
                        setOb['latest'] = Date.now();
                        Book.update({_id: book._id}, {$set: setOb}, function (err) {
                            if (err) {
                                return res.status(500).send("无法保存此书");
                            }
                            return res.json({status: 200, result: 1, data: topic});
                        });
                    });
                } else {
                    return res.json({status: 200, result: 1, data: topic});
                }

            });
        },

        /**
         * Update an topic
         */
        update: function (req, res) {
            if (req.body.tags && typeof (req.body.tags) == "string") {
                req.body.tags = req.body.tags.split(/\s+/);
            }
            var topic = req.topic;

            topic = _.extend(topic, req.body);
            topic.save(function (err) {
                if (err) {
                    return res.status(500).send("保存失败");
                }

                res.json({status: 200, result: 1, data: topic});
            });
        },
        /**
         * Delete an topic
         */
        destroy: function (req, res) {
            var topic = req.topic;
            topic.remove(function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the topic'
                    });
                }
                res.json(topic);
            });
        },
        /**
         * Show an topic
         */
        show: function (req, res) {
            res.json(req.topic);
        },
        /**
         * List of Topics
         */
        all: function (req, res) {
            var conditions = {};
            // if(!req.user.isAdmin){
            //     conditions.user=req.user;
            // }
            if (req.body.topicIds) {
                if (typeof (req.body.topicIds) == "string") req.body.topicIds = [req.body.topicIds];
                conditions._id = {$in: req.body.topicIds};
                req.query.pageItem = 200;
            }
            if (req.query.subject) {
                conditions.subject = req.query.subject;
            }
            if (req.query.tags) {
                if (typeof (req.query.tags) == 'string') {
                    req.query.tags = [req.query.tags];
                }
                conditions.tags = {$all: req.query.tags};
            }

            var profile = req.query.profile;
            if(profile === 'private') {
                conditions.user=req.user;
            }
            if(profile === 'public') {
                conditions.profile ='public';
            }

            var ItemInPage = 20;
            ItemInPage = parseInt(req.query.pageItem) ? parseInt(req.query.pageItem) : ItemInPage;
            var page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
            async.parallel([function (callback) {
                Topic.count(conditions, function (err, result) {
                    callback(err, result);
                });
            }, function (callback) {
                Topic.find(conditions)
                    .skip((page - 1) * ItemInPage)
                    .limit(ItemInPage).sort('-created')
                    .populate('user', 'name username')
                    .populate('knowledge', '_id title level parent')
                    .exec(function (err, results) {
                        callback(err, results);
                    });
            }], function (err, results) {
                if (err) {
                    res.status(400).json({msg: '查询失败'});
                } else {
                    var list = results[1];
                    var queryTopicIds = req.body.topicIds;
                    if (queryTopicIds && list.length > 1) {
                        list.sort(function (a, b) {
                            return queryTopicIds.indexOf(a._id.toString()) - queryTopicIds.indexOf(b._id.toString());
                        });
                    }
                    // 学生用户，获取答案
                    if (req.user.userType === 'student' && list.length > 0) {
                        var topics = [];
                        _.each(list, function (item) {
                            topics.push(item._id);
                        });
                        var count = results[0];
                        checkTopicAnswer(topics, req.user._id, function (err, results) {
                            if (err) return res.state(400).send('查询用户回答错误');
                            var list2 = [];
                            _.each(list, function (item) {
                                var item2 = item.toObject();
                                for (var i = 0; i < results.length; i++) {
                                    if (item2._id.toString() === results[i].topic.toString()) {
                                        item2.myAnswer = results[i].toObject();
                                        item2.done = true;
                                        break;
                                    }
                                }
                                list2.push(item2);
                            });
                            return res.json({
                                status: 200,
                                result: 1,
                                data: {count: count, list: list2, page: page, pageItem: ItemInPage}
                            });
                        });
                    } else {
                        return res.json({
                            status: 200,
                            result: 1,
                            data: {count: results[0], list: list, page: page, pageItem: ItemInPage}
                        });
                    }

                }
            });

        },

        childAll: function (req, res) {
            var childrenId = req.query.childrenId || '';
            var conditions = {};
            if (req.body.topicIds) {
                if (typeof (req.body.topicIds) == "string") req.body.topicIds = [req.body.topicIds];
                conditions._id = {$in: req.body.topicIds};
                req.query.pageItem = 200;
            }
            if (req.query.subject) {
                conditions.subject = req.query.subject;
            }
            if (req.query.tags) {
                if (typeof (req.query.tags) == 'string') {
                    req.query.tags = [req.query.tags];
                }
                conditions.tags = {$all: req.query.tags};
            }

            var ItemInPage = 20;
            ItemInPage = parseInt(req.query.pageItem) ? parseInt(req.query.pageItem) : ItemInPage;
            var page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
            async.parallel([function (callback) {
                Topic.count(conditions, function (err, result) {
                    callback(err, result);
                });
            }, function (callback) {
                Topic.find(conditions)
                    .skip((page - 1) * ItemInPage)
                    .limit(ItemInPage).sort('-created')
                    .populate('user', 'name username')
                    .populate('knowledge', 'title level')
                    .exec(function (err, results) {
                        callback(err, results);
                    });
            }], function (err, results) {
                if (err) {
                    res.status(400).json({msg: '查询失败'});
                } else {
                    var list = results[1];
                    var queryTopicIds = req.body.topicIds;
                    if (queryTopicIds && list.length > 1) {
                        list.sort(function (a, b) {
                            return queryTopicIds.indexOf(a._id.toString()) - queryTopicIds.indexOf(b._id.toString());
                        });
                    }
                    // 学生用户，获取答案
                    if (list.length > 0) {
                        var topics = [];
                        _.each(list, function (item) {
                            topics.push(item._id);
                        });
                        var count = results[0];
                        checkTopicAnswer(topics,childrenId, function (err, results) {
                            if (err) return res.state(400).send('查询用户回答错误');
                            var list2 = [];
                            _.each(list, function (item) {
                                var item2 = item.toObject();
                                for (var i = 0; i < results.length; i++) {
                                    if (item2._id.toString() === results[i].topic.toString()) {
                                        item2.myAnswer = results[i].toObject();
                                        item2.done = true;
                                        break;
                                    }
                                }
                                list2.push(item2);
                            });
                            return res.json({
                                status: 200,
                                result: 1,
                                data: {count: count, list: list2, page: page, pageItem: ItemInPage}
                            });
                        });
                    } else {
                        return res.json({
                            status: 200,
                            result: 1,
                            data: {count: results[0], list: list, page: page, pageItem: ItemInPage}
                        });
                    }

                }
            });

        },

        answerTopic: function (req, res) {
            if (!req.body.myAnswer && !req.body.myAnswerImg) return res.status(400).send("请填写答案");
            var myAnswer = new MyAnswer();
            async.waterfall([
                function (callback) {
                    //检查是否已经回答过
                    checkTopicAnswer(req.topic._id, req.user._id, function (err, results) {
                        if (err) return callback(err);
                        if (results && results.length > 0) {
                            myAnswer = results[0];
                            return callback(null, 'exist');
                        } else {
                            myAnswer.user = req.user._id;
                            myAnswer.topic = req.topic._id;
                            return callback(null, 'ok');
                        }

                    });
                },
                function (result, callback) {
                    //回答所处位置
                    var location = myAnswer.location || {};
                    if (req.body.bookId) {
                        location.bookId = req.body.bookId;
                    }
                    if (req.body.taskId) {
                        location.taskId = req.body.taskId;
                    }
                    if (req.body.studentBookId) {
                        location.studentBookId = req.body.studentBookId;
                    }
                    if (!location.studentBookId && req.body.teacherBookId) {
                        var StudentBook = mongoose.model('StudentBook');
                        StudentBook.findOne({
                            user: req.user._id,
                            teacherBookId: req.body.teacherBookId
                        }, function (err, result) {
                            if (err) return callback(err);
                            if (result) {
                                location.studentBookId = result._id.toString;
                            }
                            myAnswer.location = location;
                            return callback(null, 'ok');
                        });
                    } else {
                        myAnswer.location = location;
                        return callback(null, 'ok');
                    }

                },
                function (result, callback) {
                    // 上传图片处理
                    if (!req.body.myAnswerImg) return callback(null, null);
                    var common = require("../../../common/server/controllers/index")();
                    var destDir = '/' + req.user._id.toString() + '/';
                    common.moveUpload(req.body.myAnswerImg, destDir, function (err, result) {
                        if (err) return callback(err);
                        if (result && result.url) {
                            req.body.myAnswerImg = result.url;
                            myAnswer.myAnswerImg = [result.url];
                            return callback(null, result);
                        }
                    });
                }, function (result, callback) {
                    //题目批阅

                    if (req.body.myAnswer) {
                        myAnswer.myAnswer = req.body.myAnswer;
                    }

                    if ((req.topic.type === '选择题') && req.body.myAnswer && !req.body.myAnswerImg && req.topic.answer) {
                        var iAnswer = req.body.myAnswer.toUpperCase();
                        iAnswer = _.trim(iAnswer);
                        var answer = sanitizeHtml(req.topic.answer, {
                            allowedTags: [],
                            allowedAttributes: []
                        });
                        var standAnswer = answer.split("||");
                        myAnswer.mark = '错';
                        for (var i = 0; i < standAnswer.length; i++) {
                            if (iAnswer === _.trim(standAnswer[i].toUpperCase())) {
                                myAnswer.mark = '对';
                                break;
                            }
                        }
                        myAnswer.status = '已批改';
                        return callback(null, '已批改');
                    } else {
                        myAnswer.status = '待批改';
                        return callback(null, '待批改');
                    }
                }, function (result, callback) {
                    myAnswer.save(function (err) {
                        if (err) return res.status(500).send("数据库操作错误");
                        var topic = req.topic.toObject();

                        topic.myAnswer = myAnswer.toObject();
                        callback(null, topic);
                    });
                }], function (err, result) {
                TaskExe
                    .findOne({user: myAnswer.user, task: myAnswer.location.taskId})
                    .populate('myAnswers', '_id mark')
                    .exec(function (err, result) {
                        if (err) return callback(err);
                        var taskExe = result;
                        if (taskExe) {
                            var topicsLength = taskExe.topics.length;
                            var myAnswers = taskExe.myAnswers;
                            var rightNum = _.filter(myAnswers, {mark: '对'}).length || 0;
                            var wrongtNum = _.filter(myAnswers, {mark: '错'}).length || 0;
                            var myAnswerLen = _.filter(myAnswers, {_id: myAnswer._id}).length || 0;

                            if (!myAnswerLen) {
                                var myAnswerIds = [];
                                _.each(myAnswers, function (item) {
                                    myAnswerIds.push(item._id);
                                });
                                myAnswerIds.push(myAnswer._id); //作业提交后，再提交该次作业的其他题目，需要加入作业的myAnswers里面
                                taskExe.myAnswers = myAnswerIds;
                            }
                            if(!taskExe.statistics) taskExe.statistics={};
                            taskExe.statistics.total = topicsLength ? parseInt(topicsLength) : 0;
                            // 只有判断过'对'/'错'的题目才算已批改
                            taskExe.statistics.mark = (rightNum + wrongtNum) ? parseInt(rightNum + wrongtNum) : 0;
                            var rightRate = Math.round(rightNum / topicsLength * 100);
                            taskExe.statistics.right = rightNum;
                            taskExe.statistics.rightRate = rightRate;
                            taskExe.statistics.time = Date.now();
                            taskExe.statistics.advices = common.getAdvices(rightRate);

                            taskExe.markModified('statistics');
                            taskExe.save(function (err) {
                                if (err) return res.status(500).send("数据库操作错误");
                            })
                        }
                    })
                return res.json({result: 1, data: result});
            })
        },
        myAnswer: function (req, res, next, id) {
            MyAnswer.load(id, function (err, result) {
                if (err) return res.status(500).send("数据库操作错误");
                if (!result) return res.status(404).send('不存在');
                req.myAnswer = result;
                next();
            });
        },
        updateMyAnswer: function (req, res) {
            async.series([
                function (callback) {
                    //修改我的回答 ,包括 对错，状态 ，评价
                    if (req.body.mark) {
                        req.myAnswer.mark = req.body.mark;
                        req.myAnswer.status = '已批改';
                    }
                    if (req.body.status) {
                        req.myAnswer.status = req.body.status;
                    }
                    if (req.body.remark) {
                        req.myAnswer.mark = req.body.remark;
                    }
                    if (req.body.score){
                        req.myAnswer.score = req.body.score;
                    }
                    if (req.body.comment) {
                        if (!req.myAnswer.comment) {
                            req.myAnswer.comment = [];
                        }
                        if (_.isArray(req.body.comment)) {
                            req.myAnswer.comment = req.myAnswer.comment.concat(req.body.comment);
                        } else {
                            req.myAnswer.comment.push(comment);
                        }
                    }
                    req.myAnswer.save(function (err) {
                        if (err) return callback(err);
                        callback(null, req.myAnswer);
                    });
                },
                function (callback) {
                    // 未提交作业 无作业记录 所以无作业的统计信息(正确率、批改道数)
                    TaskExe
                        .findOne({user: req.myAnswer.user, task: req.myAnswer.location.taskId})
                        .populate('myAnswers', '_id mark')
                        .exec(function (err, result) {
                                if (err) return callback(err);
                                var taskExe = result;
                                if (!taskExe) {
                                    return callback(null, null);
                                }

                                var topicsLength = taskExe.topics.length;
                                var myAnswers = taskExe.myAnswers || [];
                                var rightNum = _.filter(myAnswers, {mark: '对'}).length || 0;
                                var wrongtNum = _.filter(myAnswers, {mark: '错'}).length || 0;
                                var myAnswerLen = _.filter(myAnswers, {_id: req.myAnswer._id}).length || 0;

                                if (!myAnswerLen) {
                                    // 获取之前已提交的题目
                                    var myAnswerIds = [];
                                    _.each(myAnswers, function (item) {
                                        myAnswerIds.push(item._id);
                                    });

                                    myAnswerIds.push(req.myAnswer._id); //作业提交后，再提交该次作业的其他题目，需要加入作业的myAnswers里面
                                    taskExe.myAnswers = myAnswerIds;
                                }
                                if(!taskExe.statistics){
                                    taskExe.statistics={};
                                }
                                taskExe.statistics.total = topicsLength ? parseInt(topicsLength) : 0;
                                // 只有判断过'对'/'错'的题目才算已批改
                                taskExe.statistics.mark = (rightNum + wrongtNum) ? parseInt(rightNum + wrongtNum) : 0;
                                var rightRate = Math.round(rightNum / topicsLength * 100);
                                taskExe.statistics.right = rightNum;
                                taskExe.statistics.rightRate = rightRate;
                                taskExe.statistics.advices = common.getAdvices(rightRate);
                                taskExe.statistics.time = Date.now();
                                taskExe.markModified('statistics');

                                taskExe.save(function (err) {
                                    if (err) return callback(err);
                                    callback(null, taskExe);
                                })
                            }
                        )
                    ;
                }

            ], function (err, results) {
                if (err) return res.status(500).send("数据库操作错误");
                return res.json({result: 1, data: results[0]});
            })
        },
        //程序补丁，修复题目仅支持单个截图到支持多个截图
        updateTopicImg: function (req, res) {
            Topic.find({'image.stemImg': {$exists: true}}).limit(200).exec(function (err, results) {
                if (err) return res.status(500).send("数据库访问错误");
                var success = 0;
                async.each(results, function (item, callback) {
                    if (item.image.stemImg) {
                        item.image.stem = [{
                            dataUrl: item.image.stemImg,
                            position: item.image.stemPosition
                        }];
                        delete item.image.stemImg;
                        delete item.image.stemPosition;
                    }
                    if (item.image.answerBlockImg) {
                        item.image.answerBlock = [{
                            dataUrl: item.image.answerBlockImg,
                            position: item.image.answerBlockPosition
                        }];
                        delete item.image.answerBlockImg;
                        delete item.image.answerBlockPosition;
                    }
                    item.markModified('image');
                    item.save(function (err, result) {
                        if (err) return callback(err);
                        success++;
                        callback(null);
                    });
                }, function (err) {
                    return res.json({result: 1, data: success});
                });

            });
        }
    };
}