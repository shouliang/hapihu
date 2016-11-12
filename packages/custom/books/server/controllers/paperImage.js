'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    PaperImage = mongoose.model('PaperImage'),
    config = require('meanio').loadConfig(),
    _ = require('lodash'),
    async = require('async');

module.exports = function () {

    return {
        /**
         * Find PaperImage by id
         */
        paperImage: function (req, res, next, id) {
            PaperImage.load(id, function (err, paperImage) {
                if (err) return next(err);
                if (!paperImage) return next(new Error('Failed to load PaperImage ' + id));
                req.paperImage = paperImage;
                next();
            });
        },

        // 批量创建
        bulkCreate: function (req, res) {
            var postImages = req.body.postImages;
            if (!_.isArray(postImages)) {
                postImages = [postImages];
            }

            var taskId = req.task._id.toString();

            var common = require("../../../common/server/controllers/index")();

            var destDir = "/paperImage/" + taskId + "/";

            var reg = new RegExp(/^\/uploads/);
            var tasks = [];

            for (var i = 0; i < postImages.length; i++) {
                postImages[i].task = taskId;
                tasks.push(
                    (function (_id, task, url, originalName) {
                        return function (callback) {
                            if (reg.test(url)) {
                                common.moveUpload(url, destDir, function (err, result) {
                                    if (err) return callback(err);
                                    if (result && result.url && result.local) {
                                        if (_id) {
                                            PaperImage.findAndUpdate(_id,
                                                {
                                                    task: task,
                                                    url: result.url,
                                                    path: result.local,
                                                    user: req.user._id,
                                                    width: result.width,
                                                    height: result.height,
                                                    originalName: originalName
                                                }
                                                , function (err, doc) {
                                                    if (err) {
                                                        return callback(err);
                                                    }
                                                    callback(null, doc);
                                                })
                                        } else {
                                            var paperImage = new PaperImage({
                                                task: task,
                                                url: result.url,
                                                path: result.local,
                                                width: result.width,
                                                height: result.height,
                                                originalName: originalName
                                            });
                                            paperImage.user = req.user._id;

                                            paperImage.save(function (err) {
                                                if (err) {
                                                    return callback(err);
                                                }
                                                callback(null, paperImage);
                                            });
                                        }


                                    }
                                });
                            } else {
                                PaperImage.findAndUpdate(_id,
                                    {
                                        task: task,
                                        user: req.user._id,
                                        originalName: originalName
                                    }
                                    , function (err, doc) {
                                        if (err) {
                                            return callback(err);
                                        }
                                        callback(null, doc);
                                    })
                            }
                        }
                    })(postImages[i]._id, postImages[i].task, postImages[i].url, postImages[i].originalName)
                );
            }

            async.series(tasks, function (err, results) {
                if (err) return res.json(err);
                res.json({result: 1, data: results});
            });

        },

        /**
         * Update an PaperImage
         */
        update: function (req, res) {
            var paperImage = req.paperImage;
            //check mark image
            async.waterfall([
                function (callback) {
                    if (req.body.mark && (!paperImage.mark || paperImage.mark.imgData !== req.body.mark.imgData)) {
                        if (!req.body.mark.imgData) return callback(null, null);
                        var common = require("../../../common/server/controllers/index")();
                        var destDir = "/paperImage/" + taskId + "/";
                        common.getPngFileFromBase64(req.body.mark.imgData, destDir, function (err, result) {
                            callback(err, result);
                        });
                    } else {
                        callback(null, null);
                    }
                }
            ], function (err, result) {
                if (err) return res.status(400).send('图片处理失败');
                if (result) {
                    req.body.mark.imgUrl = result.url;
                    req.body.mark.imgPath = result.local;
                    req.body.mark.width = result.width;
                    req.body.mark.height = result.height;
                    paperImage.markModified('mark');
                }
                paperImage.updated = Date.now();
                paperImage = _.extend(paperImage, req.body);
                paperImage.save(function (err) {
                    if (err) {
                        return res.status(500).json({
                            error: 'Cannot update the PaperImage'
                        });
                    }
                    res.json(paperImage);
                });
            });


        },
        /**
         * Delete an PaperImage
         */
        destroy: function (req, res) {
            var paperImage = req.paperImage;
            paperImage.remove(function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the PaperImage'
                    });
                }
                res.json(paperImage);
            });
        },
        /**
         * Show an PaperImage
         */
        show: function (req, res) {
            res.json(req.paperImage);
        },
        /**
         * List of PaperImages
         */
        all: function (req, res) {
            var conditions = {};
            if (req.task) {
                conditions.task = req.task._id;
            }
            if (req.query.pageNum) {
                conditions.pageNum = req.query.pageNum;
            }

            var ItemInPage = 100;
            ItemInPage = parseInt(req.query.pageItem) ? parseInt(req.query.pageItem) : ItemInPage;
            var page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
            async.parallel([function (callback) {
                PaperImage.count(conditions, function (err, result) {
                    callback(err, result);
                });
            }, function (callback) {
                PaperImage.find(conditions).skip((page - 1) * ItemInPage).limit(ItemInPage).sort({pageNum: 1}).populate('user', 'name username').exec(function (err, results) {
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

        }
    };
}