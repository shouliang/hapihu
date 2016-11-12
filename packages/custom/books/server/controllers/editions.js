'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Edition = mongoose.model('Edition'),
    config = require('meanio').loadConfig(),
    _ = require('lodash'),
    async = require('async');

module.exports = function() {

    return {
        /**
         * Find edition by id
         */
        edition: function(req, res, next, id) {
            Edition.load(id, function(err, edition) {
                if (err) return next(err);
                if (!edition) return next(new Error('Failed to load edition ' + id));
                req.edition = edition;
                next();
            });
        },
        /**
         * Create an edition
         */
        create: function(req, res) {
            if(req.body.tags){
                req.body.tags=req.body.tags.split(/\s+/);
            }
            var edition = new Edition(req.body);
            edition.user = req.user;

            edition.save(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot save the edition'
                    });
                }
                res.json(edition);
            });
        },
        /**
         * Update an edition
         */
        update: function(req, res) {
            var edition = req.edition;
            edition = _.extend(edition, req.body);
            edition.save(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot update the edition'
                    });
                }
                res.json(edition);
            });
        },
        /**
         * Delete an edition
         */
        destroy: function(req, res) {
            var edition = req.edition;
            edition.remove(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the edition'
                    });
                }



                res.json(edition);
            });
        },
        /**
         * Show an edition
         */
        show: function(req, res) {
            res.json(req.edition);
        },
        /**
         * List of Editions
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
                Edition.count(conditions,function (err,result) {
                    callback(err,result);
                });
            },function (callback) {
                Edition.find(conditions).skip((page-1)*ItemInPage).limit(ItemInPage).sort('created').populate('user', 'name username').exec(function (err,results) {
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