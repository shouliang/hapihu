'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    _ = require('lodash'),
    async = require('async');
/**
 * Create user
 */
exports.create = function(req, res, next) {
    var user = new User(req.body);

    user.provider = 'local';

    // because we set our user.provider to local our models/user.js validation will always be true
    req.assert('mobile', '手机号码格式错误').len(11,14);
    req.assert('password', '密码请采用位4～20位').len(4, 20);
    req.assert('username', '用户名不能长于20位').len(1, 20);
    req.assert('confirmPassword', '两次密码不匹配').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        console.log("user create err:",errors);
        return res.status(400).send(errors);
    }

    // Hard coded for now. Will address this with the user permissions system in v0.3.5
    //user.roles = ['authenticated'];
    user.roles = req.body.roles;
    user.save(function(err) {
        if (err) {
            switch (err.code) {
                case 11000:
                case 11001:
                    res.status(400).send({msg:'用户名已经存在'});
                    break;
                default:
                    res.status(400).send({msg:'用户添加错误，请确认用户名没有被注册过'});
            }

            return res.status(400);
        }
        res.jsonp(user);
    });
};

/**
 * Find user by id
 */
exports.user = function(req, res, next) {
    var user=req.profile;
    res.json(user);
};
/**
 * Update a user
 */
exports.update = function(req, res) {
    var user = req.profile;
    user = _.extend(user, req.body);
    if(user.userType && user.roles.indexOf(user.userType)===-1){
        user.roles.push(user.userType);
    }
    user.markModified('profile');
    user.save(function(err) {
        if(err){
            console.log('err:',err);
            return res.status(500).json({status:200,result:0,data:"更新失败"});
        }
        res.json(user);
    });
};

/**
 * Delete an user
 */
exports.destroy = function(req, res) {
    var user = req.profile;

    user.remove(function(err) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.jsonp(user);
        }
    });
};

/**
 * List of Users
 */
exports.all = function(req, res) {
    var conditions={};
    if(req.query.userType){
        conditions.userType=req.query.userType;
    }
    if(req.query.zone){
        conditions['profile.zone']={$all:req.query.zone.split(",")};
    }
    if(req.query.username){
        var username = req.query.username.replace(/\s+/g, '[\\s\\S]*');
        var usernameReg = new RegExp(username, 'g');
        conditions.username=usernameReg;
    }
    if(req.query.name){
        var name = req.query.name.replace(/\s+/g, '[\\s\\S]*');
        var nameReg = new RegExp(name, 'g');
        conditions.name=nameReg;
    }
    var ItemInPage=20;
    ItemInPage=parseInt(req.query.pageItem)?parseInt(req.query.pageItem):ItemInPage;
    var page=parseInt(req.query.page)?parseInt(req.query.page):1;
    async.parallel([function (callback) {
        User.count(conditions,function (err,result) {
           callback(err,result);
        });
    },function (callback) {
        User.find(conditions).skip((page-1)*ItemInPage).limit(ItemInPage).sort('-created').populate('user', 'name username').exec(function (err,results) {
            callback(err,results);
        });
    }],function (err,results) {
        if(err){
            res.status(400).json({msg:'查询失败'});
        }else{
            res.json({status:200,result:1,data:{count:results[0],list:results[1],page:page,pageItem:ItemInPage}});
        }
    });
    // User.find(conditions).sort('-created').populate('user', 'name username').exec(function(err, users) {
    //     if (err) {
    //         res.render('error', {
    //             status: 500
    //         });
    //     } else {
    //         res.json(users);
    //     }
    // });
};
