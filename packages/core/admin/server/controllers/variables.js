'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Variable = mongoose.model('Variable'),
    config = require('meanio').loadConfig(),
    _ = require('lodash'),
    async = require('async');

module.exports = function() {

    return {
        /**
         * Find variable by id
         */
        variable: function(req, res, next, key) {
            Variable.load(key, function(err, variable) {
                if (err) return next(err);
                if (!variable) return res.status(400).send('参数不存在');
                req.variable = variable;
                next();
            });
        },
        /**
         * Create an variable
         */
        create: function(req, res) {
            var variable = new Variable(req.body);

            variable.save(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot save the variable'
                    });
                }
                res.json(variable);
            });
        },
        /**
         * Update an variable
         */
        update: function(req, res) {
            var variable = req.variable;

            variable = _.extend(variable, req.body);


            variable.save(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot update the variable'
                    });
                }
                res.json(variable);
            });
        },
        /**
         * Delete an variable
         */
        destroy: function(req, res) {
            var variable = req.variable;
            variable.remove(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the variable'
                    });
                }



                res.json(variable);
            });
        },
        /**
         * Show an variable
         */
        show: function(req, res) {
            res.json(req.variable);
        },
        /**
         * List of Variables
         */
        all: function(req, res) {
            var conditions={};
            if(req.query.key){
                if(req.query.key.indexOf(",")){
                    var keys=req.query.key.split(",");
                    conditions.key={$in:keys};
                }else{
                    conditions.key=req.query.key;
                }

            }
            Variable.find(conditions).exec(function (err,results) {
                if(err) res.state(400).send('没有找到相关参数');
                res.json({status:200,result:1,data:{list:results}});
            });
            // async.parallel([function (callback) {
            //     Variable.count(conditions,function (err,result) {
            //         callback(err,result);
            //     });
            // },function (callback) {
            //     Variable.find(conditions).skip((page-1)*ItemInPage).limit(ItemInPage).sort('created').exec(function (err,results) {
            //         callback(err,results);
            //     });
            // }],function (err,results) {
            //     if(err){
            //         res.status(400).json({msg:'查询失败'});
            //     }else{
            //         res.json({status:200,result:1,data:{count:results[0],list:results[1],page:page,pageItem:ItemInPage}});
            //     }
            // });

        }
    };
}