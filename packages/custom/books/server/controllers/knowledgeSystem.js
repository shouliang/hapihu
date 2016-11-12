'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    KnowledgeSystem = mongoose.model('KnowledgeSystem'),
    config = require('meanio').loadConfig(),
    _ = require('lodash'),
    async = require('async');

var http = require('http');


module.exports = function () {

    return {
        /**
         * Find KnowledgeSystem by id
         */
        knowledgeSystem: function (req, res, next, id) {
            KnowledgeSystem.load(id, function (err, knowledgeSystem) {
                if (err) return next(err);
                if (!knowledgeSystem) return next(new Error('Failed to load KnowledgeSystem ' + id));
                req.knowledgeSystem = knowledgeSystem;
                next();
            });
        },
        /**
         * Create an KnowledgeSystem
         */
        create: function (req, res) {
            var knowledgeSystem = new KnowledgeSystem(req.body);
            knowledgeSystem.user = req.user._id;

            knowledgeSystem.save(function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot save the KnowledgeSystem'
                    });
                }
                res.json(knowledgeSystem);
            });
        },
        /**
         * Update an KnowledgeSystem
         */
        update: function (req, res) {
            var Knowledge=mongoose.model('Knowledge');
            var knowledgeSystem = req.knowledgeSystem;
            knowledgeSystem.updated = Date.now();
            var ks= req.body;
            knowledgeSystem = _.extend(knowledgeSystem,ks);
            var updateKnowledgeDocument=function (knowledageData) {
                Knowledge.update({_id:knowledageData._id},{level:knowledageData.level,parent:knowledageData.parent},function (err) {
                   if(err){
                       console.log('update knowledge err:',err);
                   }
                });
            };
            var setParentOfKnowledge=function (parent,nodes) {
                _.each(nodes,function (item) {
                    if(item){
                        var parentIdString=_.isString(parent._id)?parent._id:parent._id.toString();
                        // if(item.parent!==parentIdString){
                            item.parent=parentIdString;
                            item.level=parent.level+1;
                            //update data in knowledge collection
                            updateKnowledgeDocument({_id:item._id,parent:item.parent,level:item.level});
                        // }

                        if(item.children){
                            setParentOfKnowledge(item,item.children);
                        }
                    }
                });
            };
            if(knowledgeSystem.children){
                //reset parent
                setParentOfKnowledge({_id:knowledgeSystem._id.toString(),level:0},knowledgeSystem.children);
                knowledgeSystem.markModified('children');
            }
            knowledgeSystem.save(function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot update the KnowledgeSystem'
                    });
                }
                res.json(knowledgeSystem);
            });
        },
        /**
         * Delete an KnowledgeSystem
         */
        destroy: function (req, res) {
            var knowledgeSystem = req.knowledgeSystem;
            knowledgeSystem.remove(function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the KnowledgeSystem'
                    });
                }
                res.json(knowledgeSystem);
            });
        },
        /**
         * Show an KnowledgeSystem
         */
        show: function (req, res) {
            res.json(req.knowledgeSystem);
        },
        /**
         * List of KnowledgeSystems
         */
        all: function (req, res) {
            var conditions = {};
            if (req.query.subject) {
                conditions.subject = req.query.subject;
            }
            if (req.query.grade) {
                conditions.grade = req.query.grade;
            }
            //for 学科网
            if(req.query.zxxId){
                conditions.zxxId=req.query.zxxId;
            }

            var ItemInPage = 100;
            ItemInPage = parseInt(req.query.pageItem) ? parseInt(req.query.pageItem) : ItemInPage;
            var page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
            async.parallel([function (callback) {
                KnowledgeSystem.count(conditions, function (err, result) {
                    callback(err, result);
                });
            }, function (callback) {
                KnowledgeSystem.find(conditions).skip((page - 1) * ItemInPage).limit(ItemInPage).sort('created').populate('user', 'name username').exec(function (err, results) {
                    callback(err, results);
                });
            }], function (err, results) {
                if (err) {
                    res.status(400).json({ msg: '查询失败' });
                } else {
                    res.json({
                        status: 200,
                        result: 1,
                        data: { count: results[0], list: results[1], page: page, pageItem: ItemInPage }
                    });
                }
            });

        },

        allNames: function (req, res) {
            KnowledgeSystem.find({}).select({ name: 1 }).exec(function (err, result) {
                if (err) res.json(err);
                res.json(result);
            });
        }
    };
}