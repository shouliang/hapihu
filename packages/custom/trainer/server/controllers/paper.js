'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var Paper = mongoose.model('Paper');
var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var crypto = require('crypto');
var _ = require('lodash');
var httpreq = require('httpreq');

var accessKey = "2016111020399401";
var accessSecret = "4f46c3bc3dd840309421b01dbb668d33"; // TODO 测试账号


module.exports = function () {
    return {
        /**
         * Find Paper by id
         */
        paper: function (req, res, next, id) {
            Paper.load(id, function (err, paper) {
                if (err) return next(err);
                if (!paper) return next(new Error('Failed to load Paper ' + id));
                req.paper = paper;
                next();
            });
        },


        /**
         * Create an Paper
         */
        create: function (req, res) {
            var Topic = mongoose.model('Topic');
            var paperTitle = req.body.title || '';
            var topicIds = req.body.topicIds || [];
            var topics = [];
            _.each(topicIds, function (item) {
                topics.push(mongoose.Types.ObjectId(item));
            })

            var paper = new Paper({
                user: req.user,
                title: paperTitle,
                topics: topics
            });

            if (req.paper) {
                paper = req.paper;
                paper.user = req.user;
                paper.updated = Date.now();
                paper.title = paperTitle;
                paper.topics = topics;
            }

            paper.save(function (err) {
                if (err)    return res.json({result: 0, data: err});
                res.json({result: 1, data: paper});
            })

        },

        /**
         * Create an question
         */
        createQuestion: function (req, res) {
            var Topic = mongoose.model('Topic');
            var subjectId = req.body.subjectId || 202;

            // // TODO 测试数据
            // var question =
            // {
            //     "difficult": 0,
            //     "questionOptions": {
            //         "A": "<img src=\"Upload/2015-02/12/e419dc29-7422-48b7-befb-3472b8003f40/paper.files/image006.png\" style=\"vertical-align:middle;\" />",
            //         "B": "<img src=\"Upload/2015-02/12/e419dc29-7422-48b7-befb-3472b8003f40/paper.files/image007.png\" style=\"vertical-align:middle;\" />",
            //         "C": "<img src=\"Upload/2015-02/12/e419dc29-7422-48b7-befb-3472b8003f40/paper.files/image008.png\" style=\"vertical-align:middle;\" />",
            //         "D": "<img src=\"Upload/2015-02/12/e419dc29-7422-48b7-befb-3472b8003f40/paper.files/image009.png\" style=\"vertical-align:middle;\" />"
            //     },
            //     "id": 64981,
            //     "stem": "<div><img src=\"Upload/2015-02/12/e419dc29-7422-48b7-befb-3472b8003f40/paper.files/image005.png\" style=\"vertical-align:middle;\" />的算术平方根是（　　）</div>"
            // }
            var question = req.body.question;

            var questionId = question.id;
            Topic.findOne({questionId: questionId})
                .exec(function (err, topic) {
                    if (err) return res.status(500).json({result: 0, data: err});
                    if (topic && topic.length) {
                        return res.json({result: 1, data: topic});
                    }

                    var paramMap = {
                        accessKey: accessKey,
                        questionId: questionId,
                        subjectId: subjectId,
                        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
                    };

                    var apiUrl = "http://dev.zxxk.com/api/getAnswerAndAnalyze";
                    var needEncryptString = '';

                    _.each(paramMap, function (value, key) {
                        if (value || parseInt(value) == 0) { //参数值可以为0
                            needEncryptString = needEncryptString + key + "=" + value + "&";
                        }
                    });
                    var queryString = needEncryptString; // queryString不需要accessSecret

                    needEncryptString = needEncryptString + "accessSecret=" + accessSecret;
                    var sign = crypto.createHash('sha1').update(needEncryptString).digest('hex');

                    queryString = queryString + "sign=" + sign; // queryString需要加密码后的签名
                    var url = apiUrl + "?" + queryString;

                    httpreq.get(url, function (err, response) {
                        if (err) {
                            res.json({data: err});
                        }
                        try {
                            var answer = JSON.parse(response.body);
                            if( answer.status == "error") {
                                console.log("学科网API调用发生错误：","error_code:",answer.error_code,",error_message:",answer.error_message);
                                res.json({result: 0, data: '学科网API调用发生错误:' + answer.error_message });
                            }

                            var answerStr = JSON.stringify(answer);
                            answerStr = answerStr.replace(/<img.*?src=\\['"]Upload/gi, '<img src=\\"http://static.zujuan.com/Upload');
                            answer = JSON.parse(answerStr);

                            _.each(question.questionOptions, function (value, key) {
                                question.questionOptions[key] = (value);
                            })

                            var topic = new Topic({
                                questionId: questionId,
                                stem: (question.stem),
                                difficult: question.difficult,
                                questionOptions: question.questionOptions,
                                answer: (answer.data.answer),
                                analysis: (answer.data.questionAnalyze)
                            });

                            topic.save(function (err) {
                                if (err) return res.json({result: 0, data: err});
                                res.json({result: 1, data: topic});
                            })
                        }
                        catch (e) {
                            res.json({result: 1, data: e});
                        }

                    });

                })
        },

        /**
         * Delete an Paper
         */
        destroy: function (req, res) {
            var paper = req.paper;
            var id = paper._id;
            var options = {_id: id, delFlag: 1};
            paper.update(options, function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the Paper'
                    });
                }
                res.status(200).json({success: 1});
            });
        }
        ,

        /**
         * Show an Paper
         */
        show: function (req, res) {
            res.json(req.paper);
        }
        ,

        /**
         * List of Papers
         */
        all: function (req, res) {
            var conditions = {
                delFlag: 0
            };

            if (req.query.title) {
                conditions.title = new RegExp(req.query.title);//模糊查询
            }

            var ItemInPage = 10;
            ItemInPage = parseInt(req.query.pageItem) ? parseInt(req.query.pageItem) : ItemInPage;
            var page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
            async.parallel([function (callback) {
                Paper.count(conditions, function (err, result) {
                    callback(err, result);
                });
            }, function (callback) {
                Paper.find(conditions).skip((page - 1) * ItemInPage).limit(ItemInPage).sort('created')
                    .populate('user', 'name username')
                    .populate('topics', 'questionId difficult questionOptions stem answer analysis')
                    .exec(function (err, results) {
                        callback(err, results);
                    });
            }], function (err, results) {
                if (err) {
                    res.status(400).json({msg: '查询失败'});
                } else {
                    var list = results[1];
                    res.json({
                        status: 200,
                        result: 1,
                        data: {count: results[0], list: list, page: page, pageItem: ItemInPage}
                    });
                }
            });

        }
    };
}
