'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    MyAnswer = mongoose.model('MyAnswer'),
    Topic = mongoose.model('Topic'),
    _ = require('lodash'),
    async = require('async');
var moment = require('moment');
var User = mongoose.model('User');
var TaskExe = mongoose.model('TaskExe');
var Task = mongoose.model('Task');

module.exports = function () {
    return {

        /**
         * List of MyAnswer errors
         */
        allErrors: function (req, res) {
            var conditions = {
                status: '已批改',
                mark: '错',
                user: req.query.userId || req.user._id
            };

            // 题目数组
            var queryTopic = [];
            if (req.query.topicIds && _.isArray(req.query.topicIds)) {
                queryTopic.push({topic: {$in: req.query.topicIds}});
                conditions["$and"] = queryTopic;
            }

            // 时间段
            var queryDate = {};
            if (req.query.beginDate && _.isDate(new Date(req.query.beginDate))) {
                queryDate["$gte"] = moment(new Date(req.query.beginDate));
                conditions.created = queryDate;
            }

            if (req.query.endDate && _.isDate(new Date(req.query.endDate))) {
                queryDate["$lt"] = moment(new Date(req.query.endDate)).add(1, 'd');
                conditions.created = queryDate;
            }

            var ItemInPage = 100;
            ItemInPage = parseInt(req.query.pageItem) ? parseInt(req.query.pageItem) : ItemInPage;
            var page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;

            //根据特定知识点查询
            if (req.query.knowledges) {
                // 首先根据知识点查询题目表返回topicIds,再查询myAnswer
                var knowledges = req.query.knowledges;
                if (knowledges && !_.isArray(knowledges)) {
                    knowledges = [req.query.knowledges];
                }
                async.auto({
                    getTopicIds: function (callback) {
                        Topic.find({
                            knowledges: {$in: knowledges}
                        })
                            .exec(function (err, results) {
                                if (err) {
                                    return callback(err);
                                }
                                var topicIds = [];
                                for (var i = 0; i < results.length; i++) {
                                    topicIds.push(results[i]._id);
                                }
                                callback(null, topicIds);
                            });
                    },
                    getCount: ['getTopicIds', function (callback, beforeResults) {
                        queryTopic.push({topic: {$in: beforeResults.getTopicIds}});
                        conditions["$and"] = queryTopic;
                        MyAnswer.count(conditions, function (err, results) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, results);
                        });
                    }],
                    getList: ['getTopicIds', function (callback, beforeResults) {
                        queryTopic.push({topic: {$in: beforeResults.getTopicIds}});
                        conditions["$and"] = queryTopic;
                        MyAnswer.find(conditions)
                            .skip((page - 1) * ItemInPage)
                            .limit(ItemInPage)
                            .sort('created')
                            .populate('user', 'name username')
                            .populate('topic', '_id subject stem type answer analysis level from image knowledge')
                            .exec(function (err, docs) {
                                if (err) {
                                    return callback(err);
                                }
                                var options = {
                                    path: 'topic.knowledge',
                                    select: '_id title level',
                                    model: 'Knowledge'
                                };

                                if (err) return callback(err);
                                MyAnswer.populate(docs, options, function (err, myanswers) {
                                    if (err) return callback(err);
                                    callback(null, myanswers);
                                });
                            });
                    }]
                }, function (err, results) {
                    if (err) {
                        res.status(400).json({msg: '查询失败'});
                    } else {
                        res.json({
                            status: 200,
                            result: 1,
                            data: {count: results.getCount, list: results.getList, page: page, pageItem: ItemInPage}
                        });
                    }
                });
            } else {
                async.parallel([function (callback) {
                    MyAnswer.count(conditions, function (err, results) {
                        callback(err, results);
                    });
                }, function (callback) {
                    MyAnswer.find(conditions)
                        .skip((page - 1) * ItemInPage)
                        .limit(ItemInPage)
                        .sort('created')
                        .populate('user', 'name username')
                        .populate('topic', '_id subject stem type answer analysis level from image knowledge')
                        .exec(function (err, docs) {
                            var options = {
                                path: 'topic.knowledge',
                                select: '_id title level',
                                model: 'Knowledge'
                            };

                            if (err) return callback(err);
                            MyAnswer.populate(docs, options, function (err, myanswers) {
                                if (err) return callback(err);
                                callback(null, myanswers);
                            });
                        });
                }], function (err, results) {
                    if (err) {
                        res.status(400).json({result: 0, data: '查询失败'});
                    } else {
                        res.json({
                            status: 200,
                            result: 1,
                            data: {count: results[0], list: results[1], page: page, pageItem: ItemInPage}
                        });
                    }
                });
            }
        },

        /**
         * 作业- 班级统计
         * @param req
         * @param res
         */
        statistics: function (req, res) {
            var conditions = {
                status: '已批改'
            };

            var taskId;
            if (req.task) {
                taskId = req.task._id.toString();
            }

            var classId;
            if (req.query.classId) {
                classId = req.query.classId;
            }

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
                getTaskExes: ["getMembers", function (callback, results) {
                    var conditions = {
                        task: taskId
                    };
                    if (classId) {
                        var members = results.getMembers;
                        conditions.user = {$in: members};
                    }
                    TaskExe
                        .find(conditions)
                        .select('_id user topics myAnswers')
                        .populate('user', '_id name username')
                        .exec(function (err, taskexes) {
                            if (err) return callback(err);
                            callback(null, taskexes);
                        })
                }],
                getTopic: ["getTaskExes", function (callback, results) {
                    var taskexes = results.getTaskExes;
                    var topics = taskexes.length ? taskexes[0].topics : [];
                    var ids = [];
                    _.each(topics, function (item) {
                        ids.push(mongoose.Types.ObjectId(item));
                    })
                    Topic
                        .find({_id: {$in: ids}})
                        .select('_id stem image')
                        .exec(function (err, topcis) {
                            if (err) return callback(err);
                            callback(null, topcis);
                        })
                }],
                getAnswers: ["getMembers", "getTaskExes", function (callback, results) {
                    var users = [];
                    var taskExes = results.getTaskExes;
                    var topics = taskExes.length ? taskExes[0].topics : [];
                    _.each(taskExes, function (item) {
                        users.push(item.user._id);
                    })
                    if (classId) {
                        users = _.intersection(_.toArray(results.getMembers.toString().split(',')), _.toArray(users.toString().split(',')));
                    }
                    conditions.user = {$in: users};
                    conditions.topic = {$in: topics}; // MyAnswer通过题目来过滤，不能通过taskId过滤，因为有可能改次作业有某些直接提交的是之前的作业答案

                    MyAnswer.find(conditions)
                        .populate('user', '_id name username')
                        .populate('topic', '_id stem image')
                        .exec(function (err, myanswers) {
                            if (err) return callback(err);
                            callback(null, myanswers);
                        })
                }],

                handleAnswers: ["getAnswers", "getTaskExes", "getTopic", function (callback, results) {
                    var taskexes = results.getTaskExes;
                    var allTaskExeUsers = [], allTaskexe = [];
                    _.each(taskexes, function (item) {
                        allTaskExeUsers.push(JSON.stringify(item.user));
                        allTaskexe.push({user: item.user._id, taskId: item._id.toString()});
                    });

                    var topics = results.getTopic;

                    // 通过题目Id进行分组
                    var myAnswers = _.groupBy(results.getAnswers, 'topic._id');

                    var finalAnswers = [];
                    for (var ti = 0; ti < topics.length; ti++) {

                        var rightAnswerUsers = [], json_rightAnswerUsers = [];
                        var wrongAnswerUsers = [];

                        var rightMyAnswers = _.filter(myAnswers[topics[ti]._id.toString()], {mark: "对"});
                        for (var i = 0; i < rightMyAnswers.length; i++) {
                            json_rightAnswerUsers.push(JSON.stringify(rightMyAnswers[i].user));
                            rightAnswerUsers.push(rightMyAnswers[i].user);
                        }

                        // xor去除正确的，都是错误的，但需要转换成JSON字符串形式才能比较
                        var wrongMyAnswers = _.xor(allTaskExeUsers, json_rightAnswerUsers) || [];

                        for (var i = 0; i < wrongMyAnswers.length; i++) {
                            var wrongAnswerUser = JSON.parse(wrongMyAnswers[i]);
                            var taskexe = _.find(allTaskexe, {user: mongoose.Types.ObjectId(wrongAnswerUser._id)});

                            if (taskexe) {
                                wrongAnswerUser.taskExe = taskexe.taskId;
                            }
                            wrongAnswerUsers.push((wrongAnswerUser));
                        }

                        var topic = (rightMyAnswers.length ? rightMyAnswers[0].topic : null) || (wrongMyAnswers.length ? wrongMyAnswers[0].topic : null) || topics[ti];
                        var rightRate = (Math.round((rightAnswerUsers.length / (rightAnswerUsers.length + wrongAnswerUsers.length)) * 100) + '%') || '0%';
                        var unRightRate = (Math.round((wrongAnswerUsers.length / (rightAnswerUsers.length + wrongAnswerUsers.length)) * 100) + '%') || '0%';

                        finalAnswers.push({
                            _id: topics[ti]._id.toString(),
                            topic: topic,
                            rightAnswers: rightAnswerUsers,
                            wrongAnswers: wrongAnswerUsers,
                            rightRate: rightRate,
                            unRightRate: unRightRate
                        })
                    }
                    callback(null, finalAnswers);
                }],
            }, function (err, results) {
                if (err) {
                    return res.json(err);
                }
                var answers = results.handleAnswers;
                res.json({result: 1, data: {count: answers.length, list: answers}});
            })
        },

        /**
         * 考试- 班级统计
         * @param req
         * @param res
         */
        exam_statistics: function (req, res) {
            var conditions = {
                status: '已批改'
            };

            var taskId;
            if (req.task) {
                taskId = req.task._id.toString();
            }

            var classIds = req.query.classIds;
            if (classIds && !_.isArray(classIds)) {
                classIds = [classIds];
            }

            async.auto({
                getMembers: function (callback) {
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

                                callback(null, members);
                            })
                    } else {
                        callback(null, null);
                    }
                },
                getTaskExes: ["getMembers", function (callback, results) {
                    var conditions = {
                        task: taskId
                    };
                    if (classIds) {
                        var members = results.getMembers;
                        conditions.user = {$in: members};
                    }
                    TaskExe
                        .find(conditions)
                        .select('_id user topics myAnswers')
                        .populate('user', '_id name username')
                        .exec(function (err, taskexes) {
                            if (err) return callback(err);
                            callback(null, taskexes);
                        })
                }],
                getTopic: ["getTaskExes", function (callback, results) {
                    var taskexes = results.getTaskExes;
                    var topics = taskexes.length ? taskexes[0].topics : [];
                    var ids = [];
                    _.each(topics, function (item) {
                        ids.push(mongoose.Types.ObjectId(item));
                    })
                    Topic
                        .find({_id: {$in: ids}})
                        .select('_id stem image')
                        .exec(function (err, topcis) {
                            if (err) return callback(err);
                            callback(null, topcis);
                        })
                }],
                getAnswers: ["getMembers", "getTaskExes", function (callback, results) {
                    var users = [];
                    var taskExes = results.getTaskExes;
                    var topics = taskExes.length ? taskExes[0].topics : [];
                    _.each(taskExes, function (item) {
                        users.push(item.user._id);
                    })
                    if (classIds) {
                        users = _.intersection(_.toArray(results.getMembers.toString().split(',')), _.toArray(users.toString().split(',')));
                    }
                    conditions.user = {$in: users};
                    conditions.topic = {$in: topics}; // MyAnswer通过题目来过滤，不能通过taskId过滤，因为有可能改次作业有某些直接提交的是之前的作业答案

                    MyAnswer.find(conditions)
                        .populate('user', '_id name username')
                        .populate('topic', '_id stem image')
                        .exec(function (err, myanswers) {
                            if (err) return callback(err);
                            callback(null, myanswers);
                        })
                }],

                handleAnswers: ["getAnswers", "getTaskExes", "getTopic", function (callback, results) {
                    var taskexes = results.getTaskExes;
                    var allTaskExeUsers = [], allTaskexe = [];
                    _.each(taskexes, function (item) {
                        allTaskExeUsers.push(JSON.stringify(item.user));
                        allTaskexe.push({user: item.user._id, taskId: item._id.toString()});
                    });

                    var topics = results.getTopic;

                    // 通过题目Id进行分组
                    var myAnswers = _.groupBy(results.getAnswers, 'topic._id');

                    var finalAnswers = [];
                    for (var ti = 0; ti < topics.length; ti++) {

                        var rightAnswerUsers = [], json_rightAnswerUsers = [];
                        var wrongAnswerUsers = [];

                        var rightMyAnswers = _.filter(myAnswers[topics[ti]._id.toString()], {mark: "对"});
                        for (var i = 0; i < rightMyAnswers.length; i++) {
                            json_rightAnswerUsers.push(JSON.stringify(rightMyAnswers[i].user));
                            rightAnswerUsers.push(rightMyAnswers[i].user);
                        }

                        // xor去除正确的，都是错误的，但需要转换成JSON字符串形式才能比较
                        var wrongMyAnswers = _.xor(allTaskExeUsers, json_rightAnswerUsers) || [];

                        for (var i = 0; i < wrongMyAnswers.length; i++) {
                            var wrongAnswerUser = JSON.parse(wrongMyAnswers[i]);
                            var taskexe = _.find(allTaskexe, {user: mongoose.Types.ObjectId(wrongAnswerUser._id)});

                            if (taskexe) {
                                wrongAnswerUser.taskExe = taskexe.taskId;
                            }
                            wrongAnswerUsers.push((wrongAnswerUser));
                        }

                        var topic = (rightMyAnswers.length ? rightMyAnswers[0].topic : null) || (wrongMyAnswers.length ? wrongMyAnswers[0].topic : null) || topics[ti];
                        var rightRate = (Math.round((rightAnswerUsers.length / (rightAnswerUsers.length + wrongAnswerUsers.length)) * 100) + '%') || '0%';
                        var unRightRate = (Math.round((wrongAnswerUsers.length / (rightAnswerUsers.length + wrongAnswerUsers.length)) * 100) + '%') || '0%';

                        // 平均得分 总得分/总人数
                        var totalScore = 0, avgScore = 0;
                        var topicAnswers = myAnswers[topics[ti]._id.toString()];
                        if (topicAnswers) {
                            var topicAnswersLen = topicAnswers.length;
                            for (var i = 0; i < topicAnswersLen; i++) {
                                if (topicAnswers[i].score && _.toNumber(topicAnswers[i].score)) {
                                    totalScore = totalScore + _.toNumber(topicAnswers[i].score);
                                }
                            }

                            if (totalScore) {
                                avgScore = Math.round(totalScore / topicAnswersLen);
                            }
                        }

                        finalAnswers.push({
                            _id: topics[ti]._id.toString(),
                            topic: topic,
                            rightAnswers: rightAnswerUsers,
                            wrongAnswers: wrongAnswerUsers,
                            rightRate: rightRate,
                            unRightRate: unRightRate,
                            avgScore: avgScore           // 新增平均得分
                        })
                    }
                    callback(null, finalAnswers);
                }],
            }, function (err, results) {
                if (err) {
                    return res.json(err);
                }
                var answers = results.handleAnswers;
                res.json({result: 1, data: {count: answers.length, list: answers}});
            })
        }
    };
}