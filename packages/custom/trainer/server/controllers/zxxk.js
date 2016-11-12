'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var Paper = mongoose.model('Paper');
var async = require('async');
var moment = require('moment');
var crypto = require('crypto');
var _ = require('lodash');
var httpreq = require('httpreq');

var accessKey = "2016111020399401";
var accessSecret = "4f46c3bc3dd840309421b01dbb668d33";

//学科网API调用公用函数
function get_zxxkApi(res, shortApiUrl, paramMap) {
    var apiUrl = "http://dev.zxxk.com" + shortApiUrl;
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
            var resData = JSON.parse(response.body);
            if (resData.status == "error") {
                console.log("学科网API调用发生错误：", "error_code:", resData.error_code, ",error_message:", resData.error_message);
                res.json({result: 0, data: '学科网API调用发生错误:' + resData.error_message});
            } else {
                var dataStr = JSON.stringify(resData.data);
                dataStr = dataStr.replace(/<img.*?src=\\['"]Upload/gi, '<img src=\\"http://static.zujuan.com/Upload');
                res.json({result: 1, data: JSON.parse(dataStr)});
            }
        } catch (e) {
            res.json({result: 0, data: '程序出错:' + e});
        }
    });

}

module.exports = function () {
    return {

        /**
         * Create an bookNodeList
         * 缓存章节
         */
        bookNodeList: function (req, res) {
            var BookNodeList = mongoose.model('BookNodeList');
            var Subject = mongoose.model('Subject');
            var bookId = req.body.bookId;
            var bookName = req.body.bookName;
            var versionId = req.body.versionId;
            var versionName = req.body.versionName;

            Subject.find({'versions.books.id': parseInt(bookId)}).exec(function (err, subject) {
                if (err) return res.status(500).json({result: 0, data: err});

                BookNodeList.findOne({bookId: bookId})
                    .exec(function (err, bookNodeList) {
                        if (err) return res.status(500).json({result: 0, data: err});
                        if (bookNodeList && bookNodeList.length) {
                            return res.json({result: 1, data: bookNodeList});
                        }

                        var paramMap = {
                            accessKey: accessKey,
                            textbookId: bookId,
                            timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
                        };

                        var apiUrl = "http://dev.zxxk.com/api/getBookNodeList";
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
                                var nodes = JSON.parse(response.body);

                                if (nodes.status == "error") {
                                    console.log("学科网API调用发生错误：", "error_code:", nodes.error_code, ",error_message:", nodes.error_message);
                                    return res.json({result: 0, data: '学科网API调用发生错误:' + nodes.error_message});
                                }

                                var sub = subject ? subject[0] : null;
                                var bookNodeList = new BookNodeList({
                                    versionId: versionId,
                                    versionName: versionName,
                                    bookId: bookId,
                                    bookName: bookName,
                                    children: nodes.data
                                });

                                if (sub) {
                                    bookNodeList = new BookNodeList({
                                        subjectId: sub.subjectId,
                                        subjectName: sub.subjectName,
                                        stageId: sub.stageId,
                                        stageName: sub.stageName,
                                        versionId: versionId,
                                        versionName: versionName,
                                        bookId: bookId,
                                        bookName: bookName,
                                        children: nodes.data
                                    });
                                }

                                bookNodeList.save(function (err) {
                                    if (err) return res.json({result: 0, data: err});
                                    res.json({result: 1, data: bookNodeList});
                                })
                            }
                            catch (e) {
                                res.json({result: 0, data: e});
                            }

                        });
                    })
            })

        },

        //------------ 通用接口API ------------

        // 获取一个学段下的科目 学段 1：小学；2：初中；3：高中
        getSubjectList: function (req, res) {
            var stage = req.query.stage;
            if (!stage || stage != 0) {
                return res.json({result: 0, data: '缺少stage参数'});
            }
            var paramMap = {
                accessKey: accessKey,
                stage: parseInt(stage) || 1,
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            get_zxxkApi(res, '/api/getSubjectList', paramMap);
        },

        // 获取一个学科下的教材版本列表 /api/getVersionList
        getVersionList: function (req, res) {
            var stage = req.query.stage;
            var paramMap = {
                accessKey: accessKey,
                stage: parseInt(stage) || 1,
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            get_zxxkApi(res, '/api/getVersionList', paramMap);
        },

        // 获取一个版本下的教材册别信息 /api/getTextbookList
        getTextbookList: function (req, res) {
            var versionId = req.query.versionId;
            var paramMap = {
                accessKey: accessKey,
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                versionId: versionId || 1,
            };

            get_zxxkApi(res, '/api/getTextbookList', paramMap);
        },

        // 获取一个学科下的所有试题类型 /api/getQuestionTypeList
        getQuestionTypeList: function (req, res) {
            var subjectId = req.query.subjectId;
            var paramMap = {
                accessKey: accessKey,
                subjectId: subjectId || 1,
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            get_zxxkApi(res, '/api/getQuestionTypeList', paramMap);
        },

        // 创建所有学科下的知识点到本地数据库 /api/getKnowledgePointList
        createKnowledgePointList: function (req, res) {
            var KnowledgeSystem = mongoose.model('KnowledgeSystem');
            var subjects = [
                {
                    "id": 101,
                    "grade": "小学",
                    "subject": "语文"
                },
                {
                    "id": 102,
                    "grade": "小学",
                    "subject": "数学"
                },
                {
                    "id": 103,
                    "grade": "小学",
                    "subject": "英语"
                },
                {
                    "id": 110,
                    "grade": "小学",
                    "subject": "科学"
                },
                {
                    "id": 111,
                    "grade": "小学",
                    "subject": "信息技术"
                },
                {
                    "id": 112,
                    "grade": "小学",
                    "subject": "美术"
                },
                {
                    "id": 113,
                    "grade": "小学",
                    "subject": "音乐"
                },
                {
                    "id": 114,
                    "grade": "小学",
                    "subject": "品德"
                },
                {
                    "id": 115,
                    "grade": "小学",
                    "subject": "体育"
                },
                {
                    "id": 201,
                    "grade": "初中",
                    "subject": "语文"
                },
                {
                    "id": 202,
                    "grade": "初中",
                    "subject": "数学"
                },
                {
                    "id": 203,
                    "grade": "初中",
                    "subject": "英语"
                },
                {
                    "id": 204,
                    "grade": "初中",
                    "subject": "物理"
                },
                {
                    "id": 205,
                    "grade": "初中",
                    "subject": "化学"
                },
                {
                    "id": 206,
                    "grade": "初中",
                    "subject": "生物"
                },
                {
                    "id": 207,
                    "grade": "初中",
                    "subject": "政治"
                },
                {
                    "id": 208,
                    "grade": "初中",
                    "subject": "历史"
                },
                {
                    "id": 209,
                    "grade": "初中",
                    "subject": "地理"
                },
                {
                    "id": 210,
                    "grade": "初中",
                    "subject": "科学"
                },
                {
                    "id": 211,
                    "grade": "初中",
                    "subject": "信息技术"
                },
                {
                    "id": 301,
                    "grade": "高中",
                    "subject": "语文"
                },
                {
                    "id": 302,
                    "grade": "高中",
                    "subject": "数学"
                },
                {
                    "id": 303,
                    "grade": "高中",
                    "subject": "英语"
                },
                {
                    "id": 304,
                    "grade": "高中",
                    "subject": "物理"
                },
                {
                    "id": 305,
                    "grade": "高中",
                    "subject": "化学"
                },
                {
                    "id": 306,
                    "grade": "高中",
                    "subject": "生物"
                },
                {
                    "id": 307,
                    "grade": "高中",
                    "subject": "政治"
                },
                {
                    "id": 308,
                    "grade": "高中",
                    "subject": "历史"
                },
                {
                    "id": 309,
                    "grade": "高中",
                    "subject": "地理"
                },
                {
                    "id": 311,
                    "grade": "高中",
                    "subject": "信息技术"
                }
            ]

            var fnTasks = [];
            _.each(subjects, function (item) {
                fnTasks.push(
                    (function (subject) {
                        return function (callback) {
                            var paramMap = {
                                accessKey: accessKey,
                                subjectId: item.id,
                                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
                            };

                            var apiUrl = "http://dev.zxxk.com/api/getKnowledgePointList";
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
                                    callback(null, {id: subject.id, data: JSON.parse(response.body)});
                                } catch (e) {
                                    return callback(e);
                                }
                            });
                        }
                    })(item)
                )
            })

            async.parallel(fnTasks, function (err, results) {
                if (err) return res.json({result: 0, data: err});

                var fnKnowledge = [];
                for (var i = 0; i < results.length; i++) {
                    fnKnowledge.push(
                        (function (knowledge) {
                            return function (callback) {
                                var subject = _.find(subjects, {id: knowledge.id});

                                var knowledgeSystem = new KnowledgeSystem({
                                    name: subject.grade + subject.subject,
                                    grade: subject.grade,
                                    subject: subject.subject,
                                    children: knowledge.data.data,
                                    zxxId: subject.id,
                                    zxxkFlag: 1
                                });
                                knowledgeSystem.save(function (err) {
                                    if (err) return callback(err);
                                    callback(null, knowledgeSystem);
                                })
                            }
                        })(results[i])
                    )
                }

                async.parallel(fnKnowledge, function (err, results) {
                    if (err) return res.json({result: 0, data: err});
                    res.json({result: 1, data: results});
                })


            })


        },

        //------------ 题库资源API ------------
        // 通过教材章节获取试题列表信息 /api/getSyncChapterQuestionList
        getSyncChapterQuestionList: function (req, res) {
            var paramMap = {
                accessKey: accessKey,
                bookNodeId1: req.query.bookNodeId1 || null,
                bookNodeId2: req.query.bookNodeId2 || null,
                bookNodeId3: req.query.bookNodeId3 || null,
                countPerPage: req.query.countPerPage || 10,
                difficult: req.query.difficult || 0,
                questionTypeId: req.query.questionTypeId,
                startPage: req.query.startPage || 0,
                subjectId: req.query.subjectId || 202,
                textbookId: req.query.textbookId,
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                versionId: req.query.versionId
            };

            get_zxxkApi(res, '/api/getSyncChapterQuestionList', paramMap);
        },

        // 通过知识点获取试题列表 /api/getKnowledgePointQuestionList
        getKnowledgePointQuestionList: function (req, res) {
            var paramMap = {
                accessKey: accessKey,
                countPerPage: req.query.countPerPage || 10,
                difficult: req.query.difficult || 0,                    // 0:全部 1:容易
                knowledgePointId1: req.query.knowledgePointId1 || null,
                knowledgePointId2: req.query.knowledgePointId2 || null,
                knowledgePointId3: req.query.knowledgePointId3 || null,
                questionTypeId: req.query.questionTypeId || 2,          //0:全部 2:选择题 6:单项选择
                startPage: req.query.startPage || 0,
                subjectId: req.query.subjectId || 202,                  // 202:初中数学 203:初中英语
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            get_zxxkApi(res, '/api/getKnowledgePointQuestionList', paramMap);
        },

        // 获取单个试题的答案和解析
        getAnswerAndAnalyze: function (req, res) {
            var paramMap = {
                accessKey: accessKey,
                questionId: req.query.questionId || 64981,
                subjectId: req.query.subjectId || 202,                  // 202:初中数学
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            get_zxxkApi(res, '/api/getAnswerAndAnalyze', paramMap);
        },


        // ------------ 插入基础数据到subject表中 ------------

        // 1.插入学科及其问题类型
        insertSubject: function (req, res) {
            var Subject = mongoose.model('Subject');
            var subjectInfos = [
                {
                    "id": 101,
                    "stageId": 1,
                    "stageName": "小学",
                    "subject": "语文"
                },
                {
                    "id": 102,
                    "stageId": 1,
                    "stageName": "小学",
                    "subject": "数学"
                },
                {
                    "id": 103,
                    "stageId": 1,
                    "stageName": "小学",
                    "subject": "英语"
                },
                {
                    "id": 110,
                    "stageId": 1,
                    "stageName": "小学",
                    "subject": "科学"
                },
                {
                    "id": 111,
                    "stageId": 1,
                    "stageName": "小学",
                    "subject": "信息技术"
                },
                {
                    "id": 112,
                    "stageId": 1,
                    "stageName": "小学",
                    "subject": "美术"
                },
                {
                    "id": 113,
                    "stageId": 1,
                    "stageName": "小学",
                    "subject": "音乐"
                },
                {
                    "id": 114,
                    "stageId": 1,
                    "stageName": "小学",
                    "subject": "品德"
                },
                {
                    "id": 115,
                    "stageId": 1,
                    "stageName": "小学",
                    "subject": "体育"
                },
                {
                    "id": 201,
                    "stageId": 2,
                    "stageName": "初中",
                    "subject": "语文"
                },
                {
                    "id": 202,
                    "stageId": 2,
                    "stageName": "初中",
                    "subject": "数学"
                },
                {
                    "id": 203,
                    "stageId": 2,
                    "stageName": "初中",
                    "subject": "英语"
                },
                {
                    "id": 204,
                    "stageId": 2,
                    "stageName": "初中",
                    "subject": "物理"
                },
                {
                    "id": 205,
                    "stageId": 2,
                    "stageName": "初中",
                    "subject": "化学"
                },
                {
                    "id": 206,
                    "stageId": 2,
                    "stageName": "初中",
                    "subject": "生物"
                },
                {
                    "id": 207,
                    "stageId": 2,
                    "stageName": "初中",
                    "subject": "政治"
                },
                {
                    "id": 208,
                    "stageId": 2,
                    "stageName": "初中",
                    "subject": "历史"
                },
                {
                    "id": 209,
                    "stageId": 2,
                    "stageName": "初中",
                    "subject": "地理"
                },
                {
                    "id": 210,
                    "stageId": 2,
                    "stageName": "初中",
                    "subject": "科学"
                },
                {
                    "id": 211,
                    "stageId": 2,
                    "stageName": "初中",
                    "subject": "信息技术"
                },
                {
                    "id": 301,
                    "stageId": 3,
                    "stageName": "高中",
                    "subject": "语文"
                },
                {
                    "id": 302,
                    "stageId": 3,
                    "stageName": "高中",
                    "subject": "数学"
                },
                {
                    "id": 303,
                    "stageId": 3,
                    "stageName": "高中",
                    "subject": "英语"
                },
                {
                    "id": 304,
                    "stageId": 3,
                    "stageName": "高中",
                    "subject": "物理"
                },
                {
                    "id": 305,
                    "stageId": 3,
                    "stageName": "高中",
                    "subject": "化学"
                },
                {
                    "id": 306,
                    "stageId": 3,
                    "stageName": "高中",
                    "subject": "生物"
                },
                {
                    "id": 307,
                    "stageId": 3,
                    "stageName": "高中",
                    "subject": "政治"
                },
                {
                    "id": 308,
                    "stageId": 3,
                    "stageName": "高中",
                    "subject": "历史"
                },
                {
                    "id": 309,
                    "stageId": 3,
                    "stageName": "高中",
                    "subject": "地理"
                },
                {
                    "id": 311,
                    "stageId": 3,
                    "stageName": "高中",
                    "subject": "信息技术"
                }
            ]

            var fnTasks = [];
            _.each(subjectInfos, function (item) {
                fnTasks.push(
                    (function (subject) {
                        return function (callback) {
                            var paramMap = {
                                accessKey: accessKey,
                                subjectId: item.id,
                                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
                            };

                            var apiUrl = "http://dev.zxxk.com/api/getQuestionTypeList";  // 试题类型
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
                                    callback(null, {id: subject.id, data: JSON.parse(response.body)});
                                } catch (e) {
                                    return callback(e);
                                }
                            });
                        }
                    })(item)
                )
            })

            async.parallel(fnTasks, function (err, results) {
                if (err) return res.json({result: 0, data: err});

                var fnSubjectInfos = [];
                for (var i = 0; i < results.length; i++) {
                    fnSubjectInfos.push(
                        (function (subjectIn) {
                            return function (callback) {
                                var subject = _.find(subjectInfos, {id: subjectIn.id});

                                var subjectInfo = new Subject({
                                    subjectId: subject.id,
                                    subjectName: subject.subject,
                                    stageId: subject.stageId,
                                    stageName: subject.stageName,
                                    questionTypes: subjectIn.data.data
                                });

                                subjectInfo.save(function (err) {
                                    if (err) return callback(err);
                                    callback(null, subjectInfo);
                                })
                            }
                        })(results[i])
                    )
                }

                async.parallel(fnSubjectInfos, function (err, results) {
                    if (err) return res.json({result: 0, data: err});
                    res.json({result: 1, data: results});
                })

            })

        },

        // 2.增加教材版本信息 例如：人教版
        insertVersions: function (req, res) {
            var Subject = mongoose.model('Subject');

            Subject.find({})
                .exec(function (err, subjectInfos) {
                    if (err) return res.json({result: 0, data: err});
                    var fnTasks = [];
                    _.each(subjectInfos, function (item) {
                        fnTasks.push(
                            (function (subject) {
                                return function (callback) {
                                    var paramMap = {
                                        accessKey: accessKey,
                                        subjectId: item.subjectId,
                                        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
                                    };

                                    var apiUrl = "http://dev.zxxk.com/api/getVersionList";  // 教材版本
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
                                            callback(null, {
                                                subjectId: subject.subjectId,
                                                data: JSON.parse(response.body)
                                            });
                                        } catch (e) {
                                            return callback(e);
                                        }
                                    });
                                }
                            })(item)
                        )
                    })

                    async.parallel(fnTasks, function (err, results) {
                        if (err) return res.json({result: 0, data: err});

                        var fnSubjectInfos = [];
                        for (var i = 0; i < results.length; i++) {
                            fnSubjectInfos.push(
                                (function (versions) {
                                    return function (callback) {
                                        var subject = _.find(subjectInfos, {subjectId: versions.subjectId});

                                        subject = _.extend(subject, {versions: versions.data.data});

                                        subject.save(function (err) {
                                            if (err) return callback(err);
                                            callback(null, subject);
                                        })
                                    }
                                })(results[i])
                            )
                        }

                        async.parallel(fnSubjectInfos, function (err, results) {
                            if (err) return res.json({result: 0, data: err});
                            res.json({result: 1, data: results});
                        })

                    })
                })

        },

        // 3.增加教材类别信息 例如：七年级上册
        insertBooks: function (req, res) {
            var Subject = mongoose.model('Subject');

            Subject.find({})
                .exec(function (err, subjectInfos) {
                    if (err) return res.json({result: 0, data: err});
                    var fnTasks = [];

                    var subjectVersionIds = [];
                    _.each(subjectInfos, function (item) {
                        var versions = item.versions;
                        var versionIds = [];
                        _.each(versions, function (v) {
                            versionIds.push(v.id);
                        })
                        subjectVersionIds.push({subjectId: item.subjectId, versionIds: versionIds});
                    })

                    _.each(subjectVersionIds, function (item) {
                        var subjectId = item.subjectId;
                        var versionIds = item.versionIds;
                        _.each(versionIds, function (versionId) {

                            fnTasks.push(
                                (function (versionId) {

                                    return function (callback) {
                                        var paramMap = {
                                            accessKey: accessKey,
                                            timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                                            versionId: versionId
                                        };

                                        var apiUrl = "http://dev.zxxk.com/api/getTextbookList";  // 教材册别
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
                                                callback(null, {
                                                    subjectId: subjectId,
                                                    versionId: versionId,
                                                    data: JSON.parse(response.body)
                                                });
                                            } catch (e) {
                                                return callback(e);
                                            }
                                        });
                                    }
                                })(versionId)
                            )

                        })

                    })

                    async.parallel(fnTasks, function (err, results) {
                        if (err) return res.json({result: 0, data: err});

                        var gourpSubject = _.groupBy(results, 'subjectId');

                        var fnSubjectInfos = [];

                        for (var sj in gourpSubject) {
                            fnSubjectInfos.push(
                                (function (sj) {
                                    return function (callback) {
                                        var subject = _.find(subjectInfos, {subjectId: parseInt(sj)});
                                        var oldversions = subject.versions;

                                        var versionInfo = gourpSubject[sj];

                                        var newVersions = [];
                                        _.each(versionInfo, function (versionI) {
                                            var findVersion = _.find(oldversions, {id: versionI.versionId});
                                            findVersion = _.extend(findVersion, {books: versionI.data.data});
                                            newVersions.push(findVersion);
                                        })

                                        subject = _.extend(subject, {versions: newVersions});

                                        subject.markModified('versions');
                                        subject.save(function (err) {
                                            if (err) return callback(err);
                                            callback(null, subject);
                                        })
                                    }
                                })(sj)
                            )
                        }

                        async.parallel(fnSubjectInfos, function (err, results) {
                            if (err) return res.json({result: 0, data: err});
                            res.json({result: 1, data: results});
                        })

                    })
                })

        }

    };
}


