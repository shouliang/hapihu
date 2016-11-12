'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    School = mongoose.model('School'),
    config = require('meanio').loadConfig(),
    _ = require('lodash'),
    async = require('async');

module.exports = function() {

    return {
        /**
         * Find school by id
         */
        school: function(req, res, next, id) {
            School.load(id, function(err, school) {
                if (err) return next(err);
                if (!school) return next(new Error('Failed to load school ' + id));
                req.school = school;
                next();
            });
        },
        /**
         * Create an school
         */
        create: function(req, res) {
            if(!req.body.name){
                return res.status(400).send("请输入学校名称");
            }
            if(!req.body.postcode || req.body.postcode.length===0){
                return res.status(400).send("请选择学校所在位置");
            }
            //check if exist
            School.findOne({name:req.body.name},function (err,school) {
                if(err) return res.status(500).send("数据库访问失败");
                if(school){
                    return res.status(400).send("此学校名称已经存在");
                }
                school = new School(req.body);
                school.user = req.user;
                school.manager=[req.user._id];
                school.save(function(err) {
                    if (err) return res.status(500).send("数据库访问失败");
                    return res.json({result:1,data:school});
                });
            });

        },
        /**
         * Update an school
         */
        update: function(req, res) {
            var school = req.school;
            school = _.extend(school, req.body);
            school.save(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot update the school'
                    });
                }
                res.json(school);
            });
        },
        /**
         * Delete an school
         */
        destroy: function(req, res) {
            var school = req.school;
            school.remove(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the school'
                    });
                }



                res.json(school);
            });
        },
        /**
         * Show an school
         */
        show: function(req, res) {
            res.json(req.school);
        },
        /**
         * List of Schools
         */
        all: function(req, res) {
            var conditions={};
            if(req.query.subject){
                conditions.subject=req.query.subject;
            }
            if(req.query.grade){
                conditions.grade=req.query.grade;
            }
            if(req.query.mySchool){
                conditions.manager=req.user._id;
            }
            var ItemInPage=100;
            ItemInPage=parseInt(req.query.pageItem)?parseInt(req.query.pageItem):ItemInPage;
            var page=parseInt(req.query.page)?parseInt(req.query.page):1;
            async.parallel([function (callback) {
                School.count(conditions,function (err,result) {
                    callback(err,result);
                });
            },function (callback) {
                School.find(conditions).skip((page-1)*ItemInPage).limit(ItemInPage).sort('created').populate('user', 'name username').exec(function (err,results) {
                    callback(err,results);
                });
            }],function (err,results) {
                if(err){
                    res.status(400).json({msg:'查询失败'});
                }else{
                    res.json({status:200,result:1,data:{count:results[0],list:results[1],page:page,pageItem:ItemInPage}});
                }
            });

        }
    };
}