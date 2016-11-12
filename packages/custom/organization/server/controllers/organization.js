'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    config = require('meanio').loadConfig(),
    _ = require('lodash'),
    async = require('async');

module.exports = function() {

    return {
        /**
         * get school
         */
        show:function (req,res) {
            var School = mongoose.model('School');
            var User=mongoose.model('User');
            var school=req.school;
            if(!school.profile || !school.profile.trainers || school.profile.trainers.length===0){
                return res.json({result:1,data:school});
            }
            var trainers=[];
            _.forEach(school.profile.trainers,function (value,key) {
                if(_.isString(value)){
                    trainers.push(mongoose.Types.ObjectId(value));
                }else{
                    trainers.push(value);
                }
            });

            User.find({_id:{$in:trainers}},function (err,results) {
                if(err) return res.status(400).send('数据库访问错误');
                if(results && results.length>0){
                    for(var i=0;i<trainers.length;i++){
                        for(var j=0;j<results.length;j++){
                            if(results[j]._id.toString()===trainers[i].toString()){
                                trainers[i]=results[j];
                                break;
                            }
                        }
                    }
                }
                school.profile.trainers=trainers;
                res.json({result:1,data:school});
            });
            // School.find({_id:school._id}).populate('profile.trainers','_id username name gender profile','User').exec(function (err,result) {
            //     if(err) return res.status(400).send('数据库访问错误');
            //     res.json({result:1,data:school});
            // });
        },
        /**
         * get trainer of school
         */
        trainer:function (req,res) {
            var School = mongoose.model('School');
            var User=mongoose.model('User');
            var school=req.school;
            if(!school.profile || !school.profile.trainers || school.profile.trainers.length===0){
                return res.json({result:1,data:school});
            }
            var trainers=[];
            var targetId=req.query.trainerId;
            if(targetId){
                if(school.profile.trainers.indexOf(targetId)===-1){
                    return res.status(400).send('老师不存在');
                }
                async.series([
                    function (callback) {
                        //get base information
                        User.findOne({_id:mongoose.Types.ObjectId(targetId)}).exec(function (err,result) {
                           if(err) return callback('数据库访问错误');
                            if(!result) return callback('用户不存在');
                            var dbUser=result.toJSON();
                            callback(null,dbUser);
                        });
                    },
                    function (callback) {
                        //get school classes
                        var classesId=[];
                        if(!school.classes || school.classes.length===0){
                            return callback(null,[]);
                        }
                        _.forEach(school.classes,function (value,key) {
                           if(value && value.classId){
                               classesId.push(mongoose.Types.ObjectId(value.classId));
                           }
                        });
                        var Cclass=mongoose.model('Cclass');
                        Cclass.find({_id:{$in:classesId},'managers.userId':targetId}).sort('-created').exec(function (err,results) {
                            if(err) return callback('数据库访问失败');
                            callback(null,results);
                        });
                    }
                ],function (err,results) {
                    if(err) return res.status(400).send(err);
                    var trainer=results[0];
                    if(results[1]){
                        trainer.classes=results[1];
                    }
                    res.json({result:1,data:trainer});
                });

                return;
            }
            _.forEach(school.profile.trainers,function (value,key) {
                if(_.isString(value)){
                    trainers.push(mongoose.Types.ObjectId(value));
                }
            });
            User.find({_id:{$in:trainers}},function (err,results) {
                if(err) return res.status(400).send('数据库访问错误');
                if(results && results.length>0){
                    for(var i=0;i<trainers.length;i++){
                        for(var j=0;j<results.length;j++){
                            if(results[j]._id.toString()===trainers[i].toString()){
                                trainers[i]=results[j];
                                break;
                            }
                        }
                    }
                }
                school.profile.trainers=trainers;
                res.json({result:1,data:school});
            });
        },
        /**
         * add trainer to  school
         */
        addTrainer: function(req, res) {
            var User=mongoose.model('User');
            var School = mongoose.model('School');
            var userId=req.query.trainerId || req.body.trainerId || null;
            if(!userId) return res.status(400).send('老师不存在');
            User.findOne({_id:userId},function (err,result) {
                if(err) return  res.status(400).send('数据库访问错误');
                if(!result) return  res.status(400).send('老师不存在');
                var school=req.school;
                if(!school.profile){
                    school.profile={};
                }
                if(!school.profile.trainers){
                    school.profile.trainers=[];
                }
                school.profile.trainers.push(result._id.toString());
                school.markModified('profile');
                school.save(function (err,result) {
                    if(err) return  res.status(400).send('数据库访问错误');
                    return res.json({result:1,data:school});
                });
            });
        },
        deleteTrainer:function (req,res) {
            var school=req.school;
            var userId=req.query.trainerId || req.body.trainerId || null;
            var trainers=school.profile.trainers;
            var index=trainers.indexOf(userId);
            if(index!==-1){
                trainers.splice(index,1);
            }
            school.profile.trainers=trainers;
            school.markModified('profile');
            school.save(function (err,result) {
                if(err) return  res.status(400).send('数据库访问错误');
                return res.json({result:1,data:school});
            });
        },
        /**
         * get trainee of school
         */
        trainee:function (req,res) {
            var School = mongoose.model('School');
            var User=mongoose.model('User');
            var school=req.school;
            if(!school.profile || !school.profile.trainees || school.profile.trainees.length===0){
                return res.json({result:1,data:school});
            }
            var trainees=[];
            if(req.query.traineeId){
                trainees=[mongoose.Types.ObjectId(req.query.traineeId)];
            }else{
                _.forEach(school.profile.trainees,function (value,key) {
                    if(value && value.userId){
                        trainees.push(mongoose.Types.ObjectId(value.userId));
                    }
                });
            }
            User.find({_id:{$in:trainees}},function (err,results) {
                if(err) return res.status(400).send('数据库访问错误');
                if(results && results.length>0){

                    if(req.query.traineeId){
                        //单个用户
                        for(var i=0;i<school.profile.trainees.length;i++){
                            if(req.query.traineeId===school.profile.trainees[i].userId){
                                school.profile.trainees[i].user=results[0];
                                school.profile.trainees=[school.profile.trainees[i]];
                                break;
                            }
                        }
                    }else{
                        for(var i=0;i<school.profile.trainees.length;i++){
                            for(var j=0;j<results.length;j++){
                                if(results[j]._id.toString()===school.profile.trainees[i].userId){
                                    school.profile.trainees[i].user=results[j];
                                    break;
                                }
                            }
                        }
                    }

                }
                res.json({result:1,data:school});
            });
        },
        /*
        *   add trainee to school
         */
        addTrainee:function(req, res) {
            var User=mongoose.model('User');
            var School = mongoose.model('School');
            var userId=req.query.traineeId || req.body.traineeId || null;
            if(!userId) return res.status(400).send('老师不存在');
            User.findOne({_id:userId},function (err,result) {
                if(err) return  res.status(400).send('数据库访问错误');
                if(!result) return  res.status(400).send('老师不存在');
                var school=req.school;
                if(!school.profile){
                    school.profile={};
                }
                if(!school.profile.trainees){
                    school.profile.trainees=[];
                }
                var trainee={
                    userId:result._id.toString(),
                    username:result.username,
                    name:result.name,
                    subject:result.profile.subject,
                    mobile:result.mobile
                }
                school.profile.trainees.push(trainee);
                school.markModified('profile');
                school.save(function (err,result) {
                    if(err) return  res.status(400).send('数据库访问错误');
                    return res.json({result:1,data:school});
                });
            });
        },
        /**
         * delete trainee from org
         * @param req
         * @param res
         */
        deleteTrainee:function (req,res) {
            var school=req.school;
            var userId=req.query.traineeId || req.body.traineeId || null;
            var trainees=school.profile.trainees;
            var index=-1;
            for(var i=0;i<trainees.length;i++){
                if(trainees[i].userId===userId){
                    index=i;
                }
            }
            if(index===-1){
                return res.status(400).send('用户不存在');
            }
            trainees.splice(index,1);
            school.profile.trainees=trainees;
            school.markModified('profile');
            school.save(function (err,result) {
                if(err) return  res.status(400).send('数据库访问错误');
                return res.json({result:1,data:school});
            });
        },
        /**
         * get trainer of school
         */
        klass:function (req,res) {
            var School = mongoose.model('School');
            var Klass=mongoose.model('Cclass');
            var User=mongoose.model('User');
            var school=req.school;
            if(!school.classes || school.classes.length===0){
                return res.json({result:1,data:school});
            }
            var trainers=[];
            var targetId=req.query.classId;
            if(targetId){
                var exist=false;
                for(var i=0;i<req.school.classes.length;i++){
                    if(targetId===req.school.classes[i].classId){
                        exist=true;
                        break;
                    }
                }
                if(!exist){
                    return res.status(400).send('班级不存在');
                }
                Klass.findOne({_id:mongoose.Types.ObjectId(targetId)},function (err,result) {
                    if(err) return res.status(400).send('数据库访问错误');
                    if(!result) return res.status(400).send('班级不存在');
                    res.json({result:1,data:result});
                });
                return;
            }
            res.json({result:1,data:school});
        },
        /**
         * class manager 
         */
        klassManager:function (req,res) {
            var Cclass=mongoose.model('Cclass');
            var klass=req.cclass;
            var managers=klass.managers || [];
            if(req.body.op==='add'){
                var newManagers=req.body.managers || [];
                klass.managers=_.unionBy(managers,newManagers,'userId');
                klass.markModified('managers');
                klass.save(function (err,result) {
                   if(err) return res.status(400).send('数据访问失败');
                    res.json({result:1});
                });
            }else if(req.body.op==='delete'){
                var deleteIds=req.body.managerIds || [];
                if(_.isString(deleteIds)){
                    deleteIds=[deleteIds];
                }
                klass.managers=_.remove(managers,function (item) {
                    return deleteIds.indexOf(item.userId)===-1;
                });
                klass.markModified('managers');
                klass.save(function (err,result) {
                    if(err) return res.status(400).send('数据访问失败');
                    res.json({result:1});
                });
            }else{
                return res.status(400).send('缺少参数');
            }
        },
        /**
         * class member
         */
        klassMember:function (req,res) {
            var Cclass=mongoose.model('Cclass');
            var User=mongoose.model('User');
            var klass=req.cclass;
            var members=klass.members || [];

            if(req.body.op==='add'){
                if(!req.body.memberUsernames) return res.status(400).send('缺少参数');
                var memberUsernames=_.isString(req.body.memberUsernames)?[req.body.memberUsernames]:req.body.memberUsernames;
                User.find({username:{$in:memberUsernames}},function (err,results) {
                    if(err) return res.status(400).send('数据库访问失败');
                    if(results.length===0) return res.status(400).send('用户不存在');
                    var newUsers=[];
                    _.each(results,function (item) {
                        newUsers.push({
                            name: item.name,
                            username: item.username,
                            userId: item._id.toString(),
                            userType: item.userType,
                            status: '正常'
                        })
                    });
                    klass.members=_.unionBy(members,newUsers,'userId');
                    klass.markModified('members');
                    klass.save(function (err,result) {
                        if(err) return res.status(400).send('数据访问失败');
                        res.json({result:1,data:newUsers});
                    });
                });
            }else if(req.body.op==='delete'){
                if(!req.body.memberIds) return res.status(400).send('缺少参数');
                var memberIds=_.isString(req.body.memberIds)?[req.body.memberIds]:req.body.memberIds;
                klass.members=_.remove(members,function (item) {
                    return memberIds.indexOf(item.userId)===-1;
                });
                klass.markModified('members');
                klass.save(function (err,result) {
                    if(err) return res.status(400).send('数据访问失败');
                    res.json({result:1,data:memberIds});
                });
            }else{
                return res.status(400).send('缺少参数');
            }
        },
        /**
         * class member
         */
        traineeProducts:function (req,res) {
            if(!req.school.profile || !req.school.profile.trainees || !req.school.profile.trainees.length) return res.status(400).send('未找到此学员');
            if(!req.body.traineeId) return res.status(400).send('缺少参数');
            var User=mongoose.model('User');
            var targetId=req.body.traineeId;
            var school=req.school;
            var trainees=school.profile.trainees;
            if(req.body.op==='add'){
                var target,index;
                for(var i=0;i<trainees.length;i++){
                    if(trainees[i].userId===targetId){
                        target=trainees[i];
                        index=i;
                        break;
                    }
                }
                if(!target.products){
                    target.products=[];
                }
                target.products.push(req.body.product);
                school.markModified('profile.trainees.'+index.toString());
                school.save(function (err,result) {
                    if(err) return res.status(400).send('数据访问失败');
                    //add to class
                    if(req.body.product.classId){
                        User.findOne({_id:targetId}).select('_id username name userType').exec(function (err,result) {
                            var userOb={
                                name: result.name,
                                username: result.username,
                                userId: result._id.toString(),
                                userType: result.userType,
                                status: '正常'
                            };
                            var classIds=[{classId:req.body.product.classId}];
                            var classes = require("../../../classes/server/controllers/classes")();
                            classes.addMemberToClasses(classIds,userOb,function (err) {
                                if(err) return res.status(400).send('添加到班级失败');
                                res.json({result:1,data:req.body.product});
                            });
                        });

                    }else{
                        res.json({result:1,data:req.body.product});
                    }


                });
            }else if(req.body.op==='delete'){
                var target,index;
                for(var i=0;i<trainees.length;i++){
                    if(trainees[i].userId===targetId){
                        target=trainees[i];
                        index=i;
                        break;
                    }
                }
                if(!target.products){
                    target.products=[];
                }
                _.remove(target.products,function (item) {
                   return item.product===req.body.product.product && item.trainerId===req.body.product.trainerId && item.classId===req.body.product.classId;
                });
                school.markModified('profile.trainees.'+index.toString());
                school.save(function (err,result) {
                    if(err) return res.status(400).send('数据访问失败');
                    if(req.body.product.classId){
                        //remove from class
                        var classIds=[{classId:req.body.product.classId}];
                        var classes = require("../../../classes/server/controllers/classes")();
                        var userOb={
                            userId:targetId
                        }
                        classes.removeMemberFromClasses(classIds,userOb,function (err) {
                            if(err) return res.status(400).send('从班级删除失败');
                            res.json({result:1,data:req.body.product});
                        });
                    }else{
                        res.json({result:1,data:req.body.product});
                    }

                });
            }else{
                return res.status(400).send('缺少参数');
            }
        }
    };
}