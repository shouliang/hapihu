/**
 * Created by Heidi on 2016/7/7.
 */
var app = require('meanio').app,
    _ = require('lodash'),
    async = require('async'),
    mongoose = require('mongoose'),
    Task = mongoose.model('Task'),
    TaskExe = mongoose.model('TaskExe'),
    MyAnswer = mongoose.model('MyAnswer');
module.exports = function (task_package) {
    return {
        //把待处理的图片加载到识别队列
        startRecognize:function (req,res) {
            var imgRecognizeQueue=app.get('imgRecognizeQueue');
            if(!imgRecognizeQueue) return res.status(500).send("此功能尚未开启");
            var TaskImg = mongoose.model('TaskImg');
            TaskImg.find({status:'待处理'}).exec(function (err,results) {
                if(err) return res.status(500).send('数据库访问失败');
                _.each(results,function (item) {
                    imgRecognizeQueue.add({taskImg:item});
                })
               return res.json({result:1,data:results.length});
            });

        },
        //列出需要识别的图片
        taskExeImgs:function (req,res) {
            var page = req.query.page ? parseInt(req.query.page) : 1;
            var pageItem = req.query.pageItem ? parseInt(req.query.pageItem) : 20;
            var TaskImg = mongoose.model('TaskImg');
            async.parallel([function (callback) {
                TaskImg.count(query, function (err, result) {
                    callback(err, result);
                });
            }, function (callback) {
                TaskImg.find(query)
                    .sort({created: -1})
                    .skip((page - 1) * pageItem)
                    .limit(pageItem)
                    .populate('taskExe', "_id user")
                    .exec(function (err, results) {
                        callback(err, results);
                    });
            }], function (err, results) {
                if (err) return res.status(500).send("数据库操作错误");
                return res.json({
                    result: 1,
                    data: {count: results[0], list: results[1], page: page, pageItem: pageItem}
                });
            })
        }
    }
};