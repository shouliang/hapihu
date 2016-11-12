'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    _ = require('lodash'),
    async = require('async');

module.exports = function() {
    return {
        /**
         * get trainer infomation ,with school,trainee,classes
         */
        trainer: function(req, res, next, id) {

        },
        /**
         * get trainer infomation ,with school,trainee,classes
         */
        getTrainee:function (req,res) {
            var trainerId=req.query.trainerId || (req.user?req.user._id.toString():null);
            if(!trainerId) return res.status(400).send("缺少参数");
            var status=req.query.status || 'open';
            var page=req.query.page || 1;
            var pageItem=req.query.pageItem || 20;
            var isPrivate=req.query.isPrivate;
            async.series([
                //get Trainee school
                function (callback) {
                    var School=mongoose.model('School');
                    School.find({'profile.trainers':trainerId}).exec(function (err,results) {
                        if(err) return callback('数据库访问失败');
                        callback(null,results);
                    });
                }
            ],function (err,results) {
                if(err) res.status(400).send(err);
                //过滤trainee
                var schools=results[0];
                var school=schools?schools[0]:null;
                var trainees=[];
                if(school && school.profile.trainees) {
                    _.each(school.profile.trainees, function (item) {
                        if(item && item.products){
                            _.each(item.products,function (jtem) {
                                if(isPrivate){
                                    if (jtem.trainerId === trainerId.toString() && !jtem.classId) {
                                        trainees.push(item);
                                    }
                                }else{
                                    if (jtem.trainerId === trainerId.toString()) {
                                        trainees.push(item);
                                    }
                                }

                            });
                        }

                    });
                    var startIndex = (page - 1) * pageItem
                    var lastIndex = page * pageItem - 1;
                    if (trainees.length >= lastIndex) lastIndex = trainees.length;
                    trainees = trainees.slice(startIndex, lastIndex);
                }
                res.json({result:1,data:{count:trainees.length,list:trainees,page:page,pageItem:pageItem}});
            });
        },
        /**
         * get trainer's klass 
         */
        getKlass:function (req,res) {
            var trainerId=req.query.trainerId || (req.user?req.user._id.toString():null);
            if(!trainerId) return res.status(400).send("缺少参数");
            var Cclass=mongoose.model('Cclass');
            Cclass.find({'managers.userId':trainerId}).select('_id name managers members grade created').exec(function (err,results) {
                if(err) return res.status(400).send('数据库访问失败');
                res.json({result:1,data:{count:results.length,list:results}});
            });
        },
    };
}