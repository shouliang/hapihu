'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Company = mongoose.model('Company'),
    config = require('meanio').loadConfig(),
    _ = require('lodash'),
    async = require('async');

module.exports = function() {

    return {
        /**
         * Find company by id
         */
        company: function(req, res, next, id) {
            Company.load(id, function(err, company) {
                if (err) return next(err);
                if (!company) return next(new Error('Failed to load company ' + id));
                req.company = company;
                next();
            });
        },
        /**
         * Create an company
         */
        create: function(req, res) {
            if(req.body.tags){
                req.body.tags=req.body.tags.split(/\s+/);
            }
            var company = new Company(req.body);
            company.user = req.user;

            company.save(function(err) {
                if (err) {
                    console.log("add company error",err);
                    return res.status(500).send('添加失败');
                }
                res.json(company);
            });
        },
        /**
         * Update an company
         */
        update: function(req, res) {
            var company = req.company;

            company = _.extend(company, req.body);


            company.save(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot update the company'
                    });
                }
                res.json(company);
            });
        },
        /**
         * Delete an company
         */
        destroy: function(req, res) {
            var company = req.company;
            company.remove(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the company'
                    });
                }



                res.json(company);
            });
        },
        /**
         * Show an company
         */
        show: function(req, res) {
            res.json(req.company);
        },
        /**
         * List of Companys
         */
        all: function(req, res) {
            var conditions={};
            if(req.query.subject){
                conditions.subject=req.query.subject;
            }
            if(req.query.grade){
                conditions.grade=req.query.grade;
            }

            var ItemInPage=100;
            ItemInPage=parseInt(req.query.pageItem)?parseInt(req.query.pageItem):ItemInPage;
            var page=parseInt(req.query.page)?parseInt(req.query.page):1;
            async.parallel([function (callback) {
                Company.count(conditions,function (err,result) {
                    callback(err,result);
                });
            },function (callback) {
                Company.find(conditions).skip((page-1)*ItemInPage).limit(ItemInPage).sort('created').populate('user', 'name username').exec(function (err,results) {
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