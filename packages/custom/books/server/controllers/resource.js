'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Resource = mongoose.model('Resource'),
    config = require('meanio').loadConfig(),
    _ = require('lodash'),
    async = require('async');
var dateFormat = require('dateformat');

module.exports = function () {
    return {
        /**
         * Find Resource by id
         */
        resource: function (req, res, next, id) {
            Resource.load(id, function (err, resource) {
                if (err) return next(err);
                if (!resource) return next(new Error('Failed to load Resource ' + id));
                req.resource = resource;
                next();
            });
        },

        handleImg: function (req, res, next) {
            // 上传资源处理
            var url = req.body.url;
            if (!url) return next();

            var common = require("../../../common/server/controllers/index")();
            var destDir = "/resource/" + dateFormat(new Date(), "yyyy_mm") + "/";

            var reg = new RegExp(/^\/uploads/);

            if (reg.test(url)) {
                common.moveUpload(url, destDir, function (err, result) {
                    if (err) return next(err);
                    if (result && result.url && result.local) {
                        req.body.url = result.url;
                        req.body.path = result.local;
                    }
                    next();
                });
            } else {
                // 判断url是否存在，存在返回提示 ，只针对新建
                if(!req.body._id){
                    Resource.find({url: url}).exec(function (err, results) {
                        if (err) return next(err);
                        if (results && results.length > 0) {
                            return res.status(400).send('资源已经存在');
                        } else {
                            next()
                        }
                    });
                }else{
                    next()
                }
            }
        },

        handleImgs: function (req, res,next) {
            // var resources = [
            //     {
            //         "_id": "57a5a8dd9ccdee6914cc1218",
            //         "user": {
            //             "_id": "576b8f3ef604a7143bddc86b",
            //             "username": "admin"
            //         },
            //         "name": "我的图片1",
            //         "url": "http://ppppppp.png",
            //         "path": "/Users/zhushouliang/Documents/Development/hapihu/learn-platform/data/resource/2016_08/93463eac-bd74-4eef-8d66-64dd37c8c780.png",
            //         "__v": 0,
            //         "updated": "2016-08-06T09:46:32.602Z",
            //         "created": "2016-08-06T09:07:41.631Z",
            //         "delFlag": 0,
            //         "knowledgeIds": []
            //     },
            //     {
            //         "_id": "57a6d38a9949819018b225d1",
            //         "user": {
            //             "_id": "576b8f3ef604a7143bddc86b",
            //             "username": "admin"
            //         },
            //         "name": "我的图片修改5",
            //         "url": "http://xiaoliang/sky.png",
            //         "path": "/Users/zhushouliang/Documents/Development/hapihu/learn-platform/data/resource/2016_08/16ae4b62-7a53-4eb6-8768-592a029ef375.png",
            //         "__v": 0,
            //         "updated": "2016-08-07T06:27:21.307Z",
            //         "created": "2016-08-07T06:22:02.221Z",
            //         "delFlag": 0,
            //         "knowledgeIds": []
            //     }
            // ];

            // 从已有资源列表选择一个 存在于结点resources中的
            // 从已有资源列表选择一个 不存在于结点resources中的
            // 通过上传文件添加一个新的
            // 通过url直接添加一个新的
            // 通过url添加一个已经存在的

            // var newResources = [
            //     {
            //         "_id": "57a5a8dd9ccdee6914cc1218",
            //         "user": {
            //             "_id": "576b8f3ef604a7143bddc86b",
            //             "username": "admin"
            //         },
            //         "name": "我的图片1",
            //         "url": "http://ppppppp.png",
            //         "path": "/Users/zhushouliang/Documents/Development/hapihu/learn-platform/data/resource/2016_08/93463eac-bd74-4eef-8d66-64dd37c8c780.png",
            //         "__v": 0,
            //         "updated": "2016-08-06T09:46:32.602Z",
            //         "created": "2016-08-06T09:07:41.631Z",
            //         "delFlag": 0,
            //         "knowledgeIds": []
            //     },
            //     {
            //         "_id": "57a5b087aaaf18b614a0b349",
            //         "user": {
            //             "_id": "576b8f3ef604a7143bddc86b",
            //             "username": "admin"
            //         },
            //         "name": "我的图片3",
            //         "url": "/resource/2016_08/a88cd5de-153e-403c-a601-39cc9db92529.png",
            //         "__v": 0,
            //         "path": "/Users/zhushouliang/Documents/Development/hapihu/learn-platform/data/resource/2016_08/a88cd5de-153e-403c-a601-39cc9db92529.png",
            //         "updated": "2016-08-06T09:42:49.476Z",
            //         "created": "2016-08-06T09:40:23.983Z",
            //         "delFlag": 0,
            //         "knowledgeIds": [
            //             "vaporizing",
            //             "talking"
            //         ]
            //     },
            //     {
            //         "name": "我的图片目录添加资源1",
            //         "url": "/uploads/d4c80bdb-d816-4a89-8685-85cc52ff3350.png",
            //     },
            //     {
            //         "name": "我的图片目录添加资源2",
            //         "url": "http://www.hapihu.com/AAA.png",
            //     },
            //     {
            //         "name": "我的图片目录添加资源3",
            //         "url": "http://xiaoliang/sky.png",
            //     },
            // ];

            var resources = req.body.resources;
            // var newResources = req.body.resources;

            // 过滤已添加的资源
            var newAddResources = [];
            for (var i = 0; i < newResources.length; i++) {
                var newAddResource = newResources[i];
                if (newAddResource && newAddResource._id) {
                    if (_.filter(resources, {_id: newAddResource._id}).length == 0) {
                        resources.push(newAddResource);
                    }
                } else {
                    newAddResources.push(newAddResource);
                }
            }

            // 处理新添加的资源
            var common = require("../../../common/server/controllers/index")();
            var destDir = "/resource/" + dateFormat(new Date(), "yyyy_mm") + "/";
            var reg = new RegExp(/^\/uploads/);
            var tasks = [];

            for (var i = 0; i < newAddResources.length; i++) {
                tasks.push(
                    (function (name, url) {
                        return function (callback) {
                            // 新上传的资源，需要移动到目标文件夹后，再添加到资源表
                            if (reg.test(url)) {
                                common.moveUpload(url, destDir, function (err, result) {
                                    if (err) return callback(err);
                                    if (result && result.url && result.local) {

                                        var resource = new Resource({name: name, url: result.url, path: result.local});
                                        resource.user = req.user._id;

                                        resource.save(function (err) {
                                            if (err) {
                                                return callback(err);
                                            }
                                            callback(null, resource);
                                        });
                                    }
                                });
                            }
                            else {
                                // 通过url直接添加的资源，若已存在则直接返回，否则添加到资源表
                                Resource.find({url: url}).exec(function (err, results) {
                                    if (err) return callback(err);
                                    if (results && results.length > 0) {
                                        callback(null, results[0]);
                                    } else {
                                        var resource = new Resource({name: name, url: url});
                                        resource.user = req.user._id;

                                        resource.save(function (err) {
                                            if (err) {
                                                return callback(err);
                                            }
                                            callback(null, resource);
                                        });
                                    }
                                });
                            }
                        }
                    })(newAddResources[i].name, newAddResources[i].url)
                );
            }

            async.series(tasks, function (err, results) {
                if (err) return res.json(err);
                for (var i = 0; i < results.length; i++) {
                    resources.push(results[i]);
                }
                var resourceIds =[];
                for(var i=0;i< resources.length;i++){
                    resourceIds.push(resources[i]._id)
                }
                req.body.resourceIds=resourceIds;
                next();
                // res.json(resourceIds);
            });

        },

        /**
         * Create an Resource
         */
        create: function (req, res) {
            var resource = new Resource(req.body);
            resource.user = req.user._id;
            resource.save(function (err) {
                if (err) {
                    return res.status(500).send('数据库访问错误');
                }
                res.json(resource);
            });
        },

        /**
         * Update an Resource
         */
        update: function (req, res) {
            var resource = req.resource;
            resource.updated = Date.now();
            resource = _.extend(resource, req.body);
            resource.save(function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot update the Resource'
                    });
                }
                res.json(resource);
            });
        },
        /**
         * Delete an Resource
         */
        destroy: function (req, res) {
            var resource = req.resource;
            var id = resource._id;
            var options = {delFlag: 1};
            Resource.findAndUpdate(id, options, function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the Resource'
                    });
                }
                res.status(200).json({success: 1});
            });
        },
        /**
         * Show an Resource
         */
        show: function (req, res) {
            res.json(req.resource);
        },
        /**
         * List of Resources
         */
        all: function (req, res) {
            var conditions = {
                delFlag: 0
            };
            if(req.query.resourceIds){
                if(typeof (req.query.resourceIds) === "string") req.query.resourceIds=[req.query.resourceIds];
                conditions._id={$in:req.query.resourceIds};
                req.query.pageItem=200;
            }
            if (req.query.title) {
                conditions.title = new RegExp(req.query.title);//模糊查询
            }

            if (req.query.level) {
                conditions.level = req.query.level;
            }

            if (req.query.grade) {
                conditions.grade = req.query.grade;
            }

            if (req.query.subject) {
                conditions.subject = req.query.subject;
            }
            if (req.query.status) {
                conditions.status = req.query.status;
            }

            if (req.query.knowledgeIds) {
                var knowledge=[];
                var ids=req.query.knowledgeIds.split(',');
                _.each(ids,function (item) {
                   if(item){
                       knowledge.push(mongoose.Types.ObjectId(item));
                   }
                });
                if(knowledge.length>0){
                    conditions.knowledge = {$all: knowledge};
                }

            }

            var ItemInPage = 100;
            ItemInPage = parseInt(req.query.pageItem) ? parseInt(req.query.pageItem) : ItemInPage;
            var page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
            async.parallel([function (callback) {
                Resource.count(conditions, function (err, result) {
                    callback(err, result);
                });
            }, function (callback) {
                Resource.find(conditions).skip((page - 1) * ItemInPage).limit(ItemInPage).sort('created')
                    .populate('user', 'name username')
                    .populate('knowledge','_id title parent level')
                    .exec(function (err, results) {
                    callback(err, results);
                });
            }], function (err, results) {
                if (err) {
                    res.status(400).json({msg: '查询失败'});
                } else {
                    var list=results[1];
                    var resourceIds=req.query.resourceIds;
                    if(resourceIds && list.length>1){
                        list.sort(function (a,b) {
                            return resourceIds.indexOf(a._id.toString())-resourceIds.indexOf(b._id.toString());
                        });
                    }
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