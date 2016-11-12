/**
 * Created by Heidi on 2016/7/5.
 */
'use strict';

var mongoose = require('mongoose'),
    StudentBook = mongoose.model('StudentBook'),
    TeacherBook = mongoose.model('TeacherBook'),
    async=require('async');

module.exports=function () {
    return {
        sbook:function (req, res, next, id) {
            if(req.query.bookType==='teacherBook'){
                //如果是老师书的id
                TeacherBook.load(id, function(err, book) {
                    if (err) return res.status(500).send("数据库错误");
                    if (!book) return res.status(400).send("找不到对应资源");
                    var bookId=book.bookId;
                    StudentBook.findOne({bookId:bookId},function (err,result) {
                        if(err) return  res.status(500).send("数据库错误");
                        if (!result) return res.status(400).send("找不到对应资源");

                        if(!result.teacherBookId){
                            //add link to teacherbook
                            result.teacherBookId=book._id.toString();
                            result.save();
                        }
                        result._doc.book=book;
                        req.sbook=result;
                        next();
                    });
                });
            }else{
                StudentBook.load(id, function(err, book) {
                    if (err) return  res.status(500).send("数据库错误");
                    if (!book) return res.status(400).send("找不到对应资源");
                    req.sbook = book;
                    next();
                });
            }

        },
        find:function (req,res) {
            res.json({result:1,data:req.sbook});
        },
        /**
         * get all teacher book
         * @param req
         * @param res
         */
        all:function (req,res) {
            var query={user:req.user._id};
            async.parallel([function (callback) {
                StudentBook.count(query,function (err,result) {
                    callback(err,result);
                });
            },function (callback) {
                StudentBook.find(query,function (err,results) {
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
            code=code.replace(/\s/,'');
            if(code !== req.book.isbn) return res.status(400).send('验证码错误');
            async.waterfall([
                function (callback) {
                    StudentBook.findOne({user:req.user._id,bookId:req.book._id.toString()},function (err,result) {
                        if(err) return callback('数据库操作失败');
                        if(result) return callback('已经在用');
                        callback(null,'ok');
                    });
                },
                function (result,callback) {
                    var studentBook={
                        teacherBookId:'',
                        bookId:req.book._id.toString(),
                        name:req.book.name,
                        verificationCode:code,
                        grade:req.book.grade,
                        session:req.book.session,
                        subject:req.book.subject,
                        edition:req.book.edition,
                        cover:req.book.cover,
                        tags:req.book.tags,
                        user:req.user,
                        answers:[]
                    };
                    studentBook=new StudentBook(studentBook);
                    studentBook.save(function (err,result) {
                        if(err) return callback("添加失败");
                        callback(null,studentBook);
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
                        if(err) return res.status(400).send("数据库操作失败");
                        return res.json({result:1,data:result});
                    });
                }else{
                    return res.status(400).send("添加失败");
                }

            });
            


        },
        orderStatus:function (req,res) {
            StudentBook.findOne({bookId:req.book._id.toString(),user:req.user._id},function (err,result) {
               if(err) return res.status(500).send('数据库操作失败');
                return res.json({result:1,data:result});
            });
        }
    }
};
