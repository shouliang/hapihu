/**
 * Created by Heidi on 2016/7/5.
 */
'use strict';

var mongoose = require('mongoose'),
    TeacherBook = mongoose.model('TeacherBook'),
    async=require('async'),
    _=require('lodash');

module.exports=function () {
    return {
        tbook:function (req, res, next, id) {
            TeacherBook.load(id, function(err, book) {
                if (err) return next(err);
                if (!book) return next(new Error('Failed to load book ' + id));
                if(!book.sync){
                    var Book=mongoose.model('Book');
                    Book.findOne({_id:book.bookId},function (err,result) {
                        if(err || !result) return res.status(400).send("没有找到相关内容");
                        var syncBook=function (node_desc,node_src) {
                            node_desc.title=node_desc.title || node_src.title;
                            node_desc.aim=node_desc.aim || node_src.aim;
                            node_desc.topics=node_src.topics;
                            node_desc.resources=_.union(node_src.resources,node_desc.resources);
                            if(node_src.nodes && node_src.nodes.length>0){
                                node_desc.nodes=node_desc.nodes || [];
                                _.each(node_src.nodes,function (item,key) {
                                    node_desc.nodes[key]=node_desc.nodes[key] || {};
                                    syncBook(node_desc.nodes[key],item);
                                });
                            }
                        };
                        var newBook=result.toObject();
                        var newTeacherBook=book.toObject();
                        syncBook(newTeacherBook,newBook);
                        newTeacherBook.sync=true;
                        book=_.extend(book,newTeacherBook);
                        book.save(function (err) {
                            if(err) return res.status(400).send("访问数据库失败");
                            req.tbook = book;
                            next();
                        })

                    });
                }else{
                    req.tbook = book;
                    next();
                }
            });
        },
        find:function (req,res) {
            res.json({result:1,data:req.tbook});
        },
        /**
         * Update teacher book content
         */
        updateContent: function(req, res) {
            var book = req.tbook;
            var nodes=book.nodes;
            var path=req.body.path;
            var node=req.body.node;
            if(!path || !node){
                return res.status(400).send("没有找到此目录");
            }
            var catalogue=book;
            var setElement="";
            for(var i=0;i<path.length ;i++){
                if(catalogue.nodes[path[i]]){
                    catalogue=catalogue.nodes[path[i]];
                }else{
                    break;
                }
                if(i>0){
                    setElement+='.';
                }
                setElement+="nodes."+path[i].toString();
            }
            if(catalogue.title!=node.title){
                return res.status(400).send("没有找到此目录");
            }

            catalogue=_.extend(catalogue,node);

            var setOb={};
            setOb[setElement]=catalogue;
            setOb['latest']=Date.now();
            TeacherBook.update({_id:book._id},{$set:setOb},function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot update the book'
                    });
                }
                res.json(catalogue);
            });
        },
        /**
         * get all teacher book
         * @param req
         * @param res
         */
        all:function (req,res) {
            var query={teacherId:req.user._id.toString()};
            async.parallel([function (callback) {
                TeacherBook.count(query,function (err,result) {
                    callback(err,result);
                });
            },function (callback) {
                TeacherBook.find(query).sort({created:-1}).select("_id teacherId bookId created name verificationCode grade session subject edition cover path online publisher isbn summary tags sync").exec(function (err,results) {
                    callback(err,results);
                });
            }],function (err,results) {
                if(err) return res.status(500).send("数据库操作失败");
                return res.json({result:1,data:{count:results[0],list:results[1]}});
            })

        },
        order:function (req,res) {
            var code=req.query.bookCode;
            if(!code) return res.status(400).send('请输入验证码');
            code=code.replace(/\D/g,'');
            if(code !== req.book.isbn) return res.status(400).send('验证码错误');
            async.waterfall([
                function (callback) {
                    TeacherBook.findOne({teacherId:req.user._id.toString(),bookId:req.book._id.toString()},function (err,result) {
                        if(err) return callback('数据库操作失败');
                        if(result) return callback('已经在用');
                        callback(null,'ok');
                    });
                },
                function (result,callback) {
                    var teacherBook={
                        teacherId:req.user._id.toString(),
                        bookId:req.book._id.toString(),
                        name:req.book.name,
                        verificationCode:code,
                        grade:req.book.grade,
                        session:req.book.session,
                        subject:req.book.subject,
                        edition:req.book.edition,
                        cover:req.book.cover,
                        path:req.book.path,
                        publisher:req.book.publisher,
                        summary:req.book.summary,
                        tags:req.book.tags,
                        user:req.user,
                        nodes:req.book.nodes,
                        topics:req.book.topics,
                        resources:req.book.resources
                    };
                    teacherBook=new TeacherBook(teacherBook);
                    teacherBook.save(function (err,result) {
                        if(err) return callback("添加失败");
                        callback(null,teacherBook);
                    });
                }
            ],function (err,result) {
                if(err) return res.status(400).send(err);
                if(result){
                    var user=req.user;
                    user.profile.books=user.profile.books || [];
                    user.profile.books.push(result._id.toString());
                    user.markModified('profile.books');
                    user.save(function (err) {
                        if(err) return res.status(500).send("数据库操作失败");
                        return res.json({result:1,data:result});
                    });
                }else{
                    return res.status(400).send("添加失败");
                }

            });



        },
        orderStatus:function (req,res) {
            TeacherBook.findOne({bookId:req.book._id.toString(),teacherId:req.user._id.toString()},function (err,result) {
               if(err) {
                   console.log('orderStatus err:',err);
                   return res.status(500).send('数据库操作失败');
               }
                return res.json({result:1,data:result});
            });
        }
    }
};
