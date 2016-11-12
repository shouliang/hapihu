'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Paper = mongoose.model('Paper'),
    _ = require('lodash'),
    async = require('async');

var http = require('http');


module.exports = function () {
    var Subject=mongoose.model('Subject');
    return {
        /**
         * subject
         */
        subject:function (req,res,next,id) {
            Subject.findOne({_id:id}, function (err, result) {
                if (err) return next(err);
                if (!result) return next('科目不存在');
                req.subject = result;
                next();
            });
        },
        /**
         * 根据stage 获取subject
         */
        getSubject:function (req,res) {
            if(req.subject){
                return res.json({result:1,data:req.subject});
            }
            var stageId=req.query.stage;
            if(!stageId){
                return res.status(400).send('缺少参数');
            }
            Subject.find({stageId:stageId},function (err,results) {
               if(err) res.status(400).send('数据库访问失败');
                return res.json({result:1,data:results});
            });

        }
       
    };
}