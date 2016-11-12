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
    var getNodeByPath=function (book,path) {
        if(!book || !path) return null;
        if(typeof(path)=="string" || typeof(path)=="number"){
            path=[path];
        }
        var tnode=book;
        var setElement="";
        for(var i=0;i<path.length ;i++){
            if(tnode.nodes[path[i]]){
                tnode=tnode.nodes[path[i]];
            }else{
                break;
            }
            if(i>0){
                setElement+='.';
            }
            setElement+="nodes."+path[i].toString();
        }
        return {key:setElement,value:tnode};
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

        },
        /**
         * Update an book content
         */
        updateContent: function(req, res) {
            var book = req.book;
            var updated=book.updated || [];
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
            // console.log("catalogue before:",catalogue);

            var updatedInfo={
                time:Date.now(),
                type:'content',
                operation:'修改：【'+catalogue.title+'】'
            }
            updated.push(updatedInfo);
            if(updated.length>100){
                updated.shift();
            }
            catalogue=_.extend(catalogue,node);

            var setOb={};
            setOb[setElement]=catalogue;
            setOb['updated']=updated;
            setOb['latest']=Date.now();
            Book.update({_id:book._id},{$set:setOb},function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot update the book'
                    });
                }
                res.json(catalogue);
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
         * 同步书最新内容到老师书/学生书
         */
        synchronize: function(req, res) {
            var TeacherBook=mongoose.model('TeacherBook');
            var bookId=req.book._id.toString();
            TeacherBook.update({bookId:bookId},{$set:{sync:false}},function (err,result) {
                if(err) return res.status(500).send('数据库访问失败');
                res.json({result:1,data:result});
            });
        },
        /**
         * Show an book
         */
        show: function(req, res) {
            res.json({result:1,data:req.book});
        },
        /**
         * List of Books
         */
        all: function(req, res) {
            var conditions={};
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
        /**
         * order book
         * @param req
         * @param res
         */
        order:function (req,res) {
            if(req.user.userType==='teacher' || req.user.userType==='unioner'){
                var teacherBook=require('./teacherBook')();
                return teacherBook.order(req,res);
            }else if(req.user.userType==='student'){
                var studentBook=require('./studentBook')();
                return studentBook.order(req,res);
            }else{
                return res.status(400).send('暂不支持此类用户');
            }
        },
        /**
         * check  book order status
         */
        orderStatus:function (req,res) {
            if(req.user.userType==='teacher'){
                var teacherBook=require('./teacherBook')();
                teacherBook.orderStatus(req,res);
            }else if(req.user.userType==='student'){
                var studentBook=require('./studentBook')();
                studentBook.orderStatus(req,res);
            }else{
                res.status(400).send('暂不支持此类用户');
            }
        }
    };
}