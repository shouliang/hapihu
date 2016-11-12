'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Book = mongoose.model('Book'),
    config = require('meanio').loadConfig(),
    _ = require('lodash'),
    fs=require('fs'),
    async = require('async'),
    path=require('path');

module.exports = function(Books) {
// 同步建立多层文件夹
    var mkdirsSync=function(dirpath ,mode) {

        if (!fs.existsSync(dirpath)) {
            var pathtmp;
            dirpath.split(/[\///]/).forEach(function(dirname,key) {
                if(!dirname && key===0) {
                    pathtmp='/';
                    return;
                };
                if (pathtmp) {
                    pathtmp = path.join(pathtmp, dirname);
                }
                else {
                    pathtmp = dirname;
                }
                if (!fs.existsSync(pathtmp)) {
                    if (!fs.mkdirSync(pathtmp, mode)) {
                        return false;
                    }
                }
            });
        }
        return true;
    };
    return {
        /**
         * Find book by id
         */
        book: function(req, res, next, id) {
            Book.load(id, function(err, book) {
                if (err) return next(err);
                if (!book) return next(new Error('Failed to load book ' + id));
                req.book = book;
                next();
            });
        },
        /**
         * Create an book
         */
        create: function(req, res) {
            var companyPath='';
            if(req.user.profile.companyObject && req.user.profile.companyObject.path){
                companyPath=req.user.profile.companyObject.path;
            }else{
                return res.status(400).send("请先加入公司");
            }
            if(req.body.tags){
                req.body.tags=req.body.tags.split(/\s+/);
            }
            var book = new Book(req.body);
            book.user = req.user;
            book.updated=[Date.now()];
            book.save(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot save the book'
                    });
                }
                //建立书的文件夹

                var companyDir=config.root+'/'+config.dataDir+'/'+companyPath;
                var bookPath=companyDir+'/'+book._id;
                async.waterfall([
                    function (callback) {
                        //创建书目录
                        fs.exists(bookPath,function (result) {
                            if(result) return callback(null,'ok');
                            if(mkdirsSync(bookPath)){
                                return callback(null,'ok');
                            }else{
                                return callback('创建书籍文件夹失败');
                            }
                        });
                    },
                    function (arg,callback) {
                        if(book.cover){
                            var uploadImg=config.root+'/'+config.dataDir+book.cover;
                            var coverName=book.cover.split(/\//);
                            coverName=coverName[coverName.length-1];
                            var toImg=bookPath+'/'+coverName;
                            try{
                                var handleCover=fs.renameSync(uploadImg,toImg);
                            }catch (err){
                                return callback("封面处理失败");
                            }
                            if(handleCover){
                                callback("封面处理失败");
                            }
                            book.cover='/'+req.user.profile.companyObject.path+'/'+book._id+'/'+coverName;

                        }
                        return   callback(null,'done');

                    }],function (err,result) {
                    if(err){
                        //删除book
                        Book.remove({_id:book._id},function (err,result) {
                        });
                        return res.status(400).send(err);
                    }else{
                        //更新book
                        book.path=companyPath+'/'+book._id;
                        Book.update({_id:book._id},{$set:{path:book.path,cover:book.cover}},function (err,result) {
                            if(err) return res.status(400).send(err);
                            return res.json(book);
                        });
                    }

                })
            });
        },
        /**
         * Update an book
         */
        update: function(req, res) {
            var book = req.book;
            if(req.body.cover && book.cover!==req.body.cover){
                var uploadImg=config.root+'/'+config.dataDir+req.body.cover;
                var coverName=req.body.cover.split(/\//);
                coverName=coverName[coverName.length-1];
                var bookPath=book.path;
                if(!bookPath){
                    if(req.user.profile.companyObject && req.user.profile.companyObject.path){
                        bookPath=req.user.profile.companyObject.path+'/'+book._id;
                    }else{
                        bookPath="admin";
                    }
                }
                var toImg=config.root+'/'+config.dataDir+'/'+bookPath+'/'+coverName;
                try{
                    var handleCover=fs.renameSync(uploadImg,toImg);
                }catch (error){
                    return res.status(400).send("封面处理失败");
                }
                if(handleCover){
                    return res.status(400).send("封面处理失败");
                }
                req.body.cover='/'+bookPath+'/'+coverName;
                if(book.cover){
                    toImg=config.root+'/'+config.dataDir+book.cover;
                    fs.unlink(toImg,function () {
                        //delete old file
                    })
                }
            }

            book = _.extend(book, req.body);
            var updatedInfo={
                time:Date.now(),
                type:'info',
                operation:'修改基本信息'
            }
            if(book.updated){
                book.updated=[updatedInfo];
            }else{
                book.updated.push(updatedInfo);
            }
            if(book.updated.length>100){
                book.updated.shift();
            }
            book.latest=Date.now();
            book.save(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot update the book'
                    });
                }

                res.json(book);
            });
        },
        /**
         * Delete an book
         */
        destroy: function(req, res) {
            var book = req.book;


            book.remove(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the book'
                    });
                }

                res.json(book);
            });
        },
        /**
         * Show an book
         */
        show: function(req, res) {
            res.json(req.book);
        },
        /**
         * List of Books of the vender
         */
        venderBooks:function (req,res) {

            var conditions={};
            if(req.user.userType!=='admin'){
                conditions.user=req.user._id;
            }
            if(req.query.subject){
                conditions.subject=req.query.subject;
            }
            if(req.query.grade){
                conditions.grade=req.query.grade;
            }
            if(req.query.edition){
                conditions.edition=req.query.edition;
            }
            if(req.query.online){
                conditions.online=req.query.online;
            }
            var sortBy=['-created'];
            if(req.query.sortBy){
                sortBy.unshift(req.query.sortBy);
            }
            sortBy=sortBy.join(' ');
            var ItemInPage=20;
            ItemInPage=parseInt(req.query.pageItem)?parseInt(req.query.pageItem):ItemInPage;
            var page=parseInt(req.query.page)?parseInt(req.query.page):1;
            async.parallel([function (callback) {
                Book.count(conditions,function (err,result) {
                    callback(err,result);
                });
            },function (callback) {
                Book.find(conditions).skip((page-1)*ItemInPage).limit(ItemInPage).sort(sortBy).populate('user', 'name username').exec(function (err,results) {
                    callback(err,results);
                });
            }],function (err,results) {
                if(err){
                    res.status(400).json({msg:'查询失败'});
                }else{
                    res.json({status:200,result:1,data:{count:results[0],list:results[1],page:page,pageItem:ItemInPage}});
                }
            });
        },
        //出版社书籍分组统计
        venderBooksGroup:function (req,res) {
            Book.find({user:req.user._id})
                .select({_id:1,grade:1,subject:1,edition:1,online:1})
                .exec(function (err,results) {
                   if(err) return res.status(500).send('数据库访问出错');
                    var group={};
                    var groupIn=function (att,item) {
                        group[att]=group[att] || [];
                        var iAtt=_.find(group[att],{name:item[att]});
                        if(!iAtt){
                            group[att].push({name:item[att],size:1,members:[item._id]});
                        }else{
                            iAtt.size=iAtt.size+1;
                            iAtt.members.push(item._id);
                        }
                    }
                    _.each(results,function (item) {
                        item=item.toObject();
                        groupIn('grade',item);
                        groupIn('subject',item);
                        groupIn('edition',item);
                        groupIn('online',item);
                    });
                    return res.json({result:1,data:group});
                });
        },
        /**
         * List of Books
         */
        all: function(req, res) {
            var conditions={online:'online'};
            if(req.query.subject){
                conditions.subject=req.query.subject;
            }
            if(req.query.grade){
                conditions.grade=req.query.grade;
            }

            var ItemInPage=20;
            ItemInPage=parseInt(req.query.pageItem)?parseInt(req.query.pageItem):ItemInPage;
            var page=parseInt(req.query.page)?parseInt(req.query.page):1;
            async.parallel([function (callback) {
                Book.count(conditions,function (err,result) {
                    callback(err,result);
                });
            },function (callback) {
                Book.find(conditions).skip((page-1)*ItemInPage).limit(ItemInPage).sort('-created').populate('user', 'name username').exec(function (err,results) {
                    callback(err,results);
                });
            }],function (err,results) {
                if(err){
                    res.status(400).json({msg:'查询失败'});
                }else{
                    res.json({status:200,result:1,data:{count:results[0],list:results[1],page:page,pageItem:ItemInPage}});
                }
            });

        },
        /*
        * 获取最新修改列表
         */
        latestUpdated:function (req,res) {
            var ItemInPage=20;
            ItemInPage=parseInt(req.query.pageItem)?parseInt(req.query.pageItem):ItemInPage;
            var page=parseInt(req.query.page)?parseInt(req.query.page):1;
            async.waterfall([
                function (callback) {
                    Book.find({user:req.user._id}).select({_id:1,name:1,grade:1,subject:1,latest:1,updated:1}).sort("-latest").exec(function (err,results) {
                        callback(err,results);
                    });
                }
            ],function (err,result) {
                if(err) return res.status(500).send('数据库访问失败');
                if(result){
                    var all=[];
                    _.each(result,function (item) {
                        item=item.toObject();
                        if(item.updated && item.updated.length>0){
                            _.each(item.updated,function (sub) {
                                var record=_.extend({},sub);
                                record.bookId=item._id;
                                record.name=item.name;
                                record.subject=item.subject;
                                record.latest=item.latest;
                                record.grade=item.grade;
                                all.push(record);
                            });
                            // all=all.concat(item.updated);
                        }
                    });
                    all=_.sortBy(all,function (item) {
                        return -item.time;
                    });
                    var count=all.length;
                    var start=(page-1)*ItemInPage;
                    var end=page*ItemInPage;
                    start=count>start ? start:count;
                    end=count>start ? end:count;
                    var list=all.slice(start,end);
                    return res.json({result:1,data:{count:count,list:list,page:page,pageItem:ItemInPage}});
                }else{
                    return res.json({result:1,data:{count:0,list:[]}})
                }
            })
        }

    };
}