'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    BookImage = mongoose.model('BookImage'),
    config = require('meanio').loadConfig(),
    _ = require('lodash'),
    async = require('async');

module.exports = function () {

    return {
        /**
         * Find BookImage by id
         */
        bookImage: function (req, res, next, id) {
            BookImage.load(id, function (err, bookImage) {
                if (err) return next(err);
                if (!bookImage) return next(new Error('Failed to load BookImage ' + id));
                req.bookImage = bookImage;
                next();
            });
        },

        // 批量创建
        bulkCreate: function (req, res) {
            var postImages = req.body.postImages;
            if (!_.isArray(postImages)) {
                postImages = [postImages];
            }
            var bookId = req.book._id.toString();
            // TODO 测试数据 待删除
            // var postImages = [{
            //     _id: "57b189b3c99044e40be835ae",
            //     url: '/bookImage/111.jpg',
            //     path: '1.path',
            //     pageNum: 999,
            //     book: '579c524f545688702b2acdd4'
            // }, {
            //     url: '/uploads/222.jpg',
            //     path: '2.path',
            //     pageNum: 2,
            //     book: '579c524f545688702b2acdd4'
            // }, {
            //     url: '/uploads/333.jpg',
            //     path: '3.path',
            //     pageNum: 3,
            //     book: '579c524f545688702b2acdd4'
            // }];

            var common = require("../../../common/server/controllers/index")();

            var destDir ='/'+ req.book.path;
            // TODO 测试数据待删除
            // var destDir = "/bookImage/" + "579c524f545688702b2acdd4" + "/";
            var reg = new RegExp(/^\/uploads/);
            var tasks = [];

            for (var i = 0; i < postImages.length; i++) {
                postImages[i].book = bookId;
                tasks.push(
                    (function (_id, book, pageNum, url) {
                        return function (callback) {
                            if (reg.test(url)) {
                                common.moveUpload(url, destDir, function (err, result) {
                                    if (err) return callback(err);
                                    if (result && result.url && result.local) {
                                        if (_id) {
                                            BookImage.findAndUpdate(_id,
                                                {
                                                    pageNum: pageNum,
                                                    book: book,
                                                    url: result.url,
                                                    path: result.local,
                                                    user: req.user._id,
                                                    width:result.width,
                                                    height:result.height
                                                }
                                                , function (err, doc) {
                                                    if (err) {
                                                        return callback(err);
                                                    }
                                                    callback(null, doc);
                                                })
                                        } else {
                                            var bookImage = new BookImage({
                                                pageNum: pageNum,
                                                book: book,
                                                url: result.url,
                                                path: result.local,
                                                width:result.width,
                                                height:result.height
                                            });
                                            bookImage.user = req.user._id;

                                            bookImage.save(function (err) {
                                                if (err) {
                                                    return callback(err);
                                                }
                                                callback(null, bookImage);
                                            });
                                        }


                                    }
                                });
                            } else {
                                BookImage.findAndUpdate(_id,
                                    {
                                        pageNum: pageNum,
                                        book: book,
                                        user: req.user._id
                                    }
                                    , function (err, doc) {
                                        if (err) {
                                            return callback(err);
                                        }
                                        callback(null, doc);
                                    })
                            }
                        }
                    })(postImages[i]._id, postImages[i].book, postImages[i].pageNum, postImages[i].url)
                );
            }

            async.series(tasks, function (err, results) {
                if (err) return res.json(err);
                res.json({result:1,data:results});
            });

        },

        /**
         * Update an BookImage
         */
        update: function (req, res) {
            var bookImage = req.bookImage;
            //check mark image
            async.waterfall([
                function (callback) {
                    if( req.body.mark && (!bookImage.mark || bookImage.mark.imgData !== req.body.mark.imgData)){
                        if(!req.body.mark.imgData) return callback(null,null);
                        var common = require("../../../common/server/controllers/index")();
                        var destDir ='/'+ bookImage.book.path+'/';
                        common.getPngFileFromBase64(req.body.mark.imgData,destDir,function (err,result) {
                            callback(err,result);
                        });
                    }else{
                        callback(null,null);
                    }
                }
            ],function (err,result) {
                if(err) return res.status(400).send('图片处理失败');
                if(result){
                    req.body.mark.imgUrl=result.url;
                    req.body.mark.imgPath=result.local;
                    req.body.mark.width=result.width;
                    req.body.mark.height=result.height;
                    bookImage.markModified('mark');
                }
                bookImage.updated = Date.now();
                bookImage = _.extend(bookImage, req.body);
                bookImage.save(function (err) {
                    if (err) {
                        return res.status(500).json({
                            error: 'Cannot update the BookImage'
                        });
                    }
                    res.json(bookImage);
                });
            });


        },
        /**
         * Delete an BookImage
         */
        destroy: function (req, res) {
            var bookImage = req.bookImage;
            bookImage.remove(function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the BookImage'
                    });
                }
                res.json(bookImage);
            });
        },
        /**
         * Show an BookImage
         */
        show: function (req, res) {
            res.json(req.bookImage);
        },
        /**
         * List of BookImages
         */
        all: function (req, res) {
            var conditions = {};
            if(req.book) {
                conditions.book = req.book._id;
            }
            if(req.query.pageNum) {
                conditions.pageNum = req.query.pageNum;
            }

            var ItemInPage = 100;
            ItemInPage = parseInt(req.query.pageItem) ? parseInt(req.query.pageItem) : ItemInPage;
            var page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
            async.parallel([function (callback) {
                BookImage.count(conditions, function (err, result) {
                    callback(err, result);
                });
            }, function (callback) {
                BookImage.find(conditions).skip((page - 1) * ItemInPage).limit(ItemInPage).sort({pageNum:1}).populate('user', 'name username').exec(function (err, results) {
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