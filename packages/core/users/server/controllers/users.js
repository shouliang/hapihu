'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  async = require('async'),
  config = require('meanio').loadConfig(),
  crypto = require('crypto'),
  fs=require('fs'),
  nodemailer = require('nodemailer'),
  templates = require('../template'),
  _ = require('lodash'),
  jwt = require('jsonwebtoken');
var hz2Pinyin=require('hanzi_to_pinyin');

var https = require('https');
var qs = require('querystring');

/**
 * Send reset password email
 */
function sendMail(mailOptions) {
    var transport = nodemailer.createTransport(config.mailer);
    transport.sendMail(mailOptions, function(err, response) {
        if (err) return err;
        return response;
    });
}

module.exports = function(MeanUser) {
    return {
        /**
         * Auth callback
         */
        authCallback: function(req, res) {
          // var payload = req.user;
            var payload = {
                _id:req.user._id,
                username:req.user.username,
                name:req.user.name,
                // password:req.user.password,
                userType:req.user.userType,
                mobile:req.user.mobile,
                roles:req.user.roles
            };
          var escaped = JSON.stringify(payload);
          escaped = encodeURI(escaped);
          // We are sending the payload inside the token
          var token = jwt.sign(escaped, config.secret, { }); //60天
          res.cookie('token', token);
          var destination = config.strategies.landingPage;
          if(!req.cookies.redirect)
            res.cookie('redirect', destination);
          res.redirect(destination);
        },

        /**
         * Show login form
         */
        signin: function(req, res) {
          if (req.isAuthenticated()) {
            return res.redirect('/');
          }
          res.redirect(config.public.loginPage);
        },

        /**
         * Logout
         */
        signout: function(req, res) {
            req.logout();
            res.redirect('/');
        },

        /**
         * Session
         */
        session: function(req, res) {
          res.redirect('/');
        },

        /**
         * Create user
         */
        create: function(req, res, next) {
            var mobile = req.body.mobile;
            var code=req.body.mobile_code;
            code = mobile.toString()+"+"+code.toString();
            // req.session.mobileCode = code;
            if (req.session.mobileCode!== code) {
                return res.status(400).json([{msg:'手机验证失败',param:'mobile',value:mobile}]);
            }
            var user = new User(req.body);
            user.provider = 'local';
            user.mobile=mobile;
            // because we set our user.provider to local our models/user.js validation will always be true
            // req.assert('name', '你需要输入用户名').notEmpty();
            req.assert('userType', '请选择你的身份类型').notEmpty();
            if(req.body.email){
                req.assert('email', '邮箱地址无效').isEmail();
            }
            req.assert('password', '密码长度需要在4～20个字符之间').len(4, 20);
            req.assert('username', '用户名长度不能超过20个字符').len(1, 20);
            req.assert('confirmPassword', '输入的两次密码不一致').equals(req.body.password);

            var errors = req.validationErrors();
            if (errors) {
                return res.status(400).send(errors);
            }

            // Hard coded for now. Will address this with the user permissions system in v0.3.5
            user.roles = ['authenticated'];
            user.roles.push(user.userType);
            //除了学生都需要人工审核
            if(user.userType==='student'){
                user.confirm='confirmed';
            }
            user.profile=user.profile || {};
            user.save(function(err) {
                if (err) {
                    switch (err.code) {
                        case 11000:
                            res.status(500).json([{msg:'系统出错'}]);
                            break;
                        case 11001:
                        res.status(400).json([{
                            msg: '用户名已经被注册',
                            param: 'username'
                        }]);
                        break;
                        default:
                        var modelErrors = [];

                        if (err.errors) {

                            for (var x in err.errors) {
                                modelErrors.push({
                                    param: x,
                                    msg: err.errors[x].message,
                                    value: err.errors[x].value
                                });
                            }

                            res.status(400).json(modelErrors);
                        }
                    }
                    return res.status(400);
                }

                var payload = {
                    _id:user._id,
                    username:user.username,
                    name:user.name,
                    // password:user.password,
                    userType:user.userType,
                    mobile:user.mobile,
                    roles:user.roles
                };
                payload.redirect = req.body.redirect;
                var escaped = JSON.stringify(payload);
                escaped = encodeURI(escaped);
                req.logIn(user, function(err) {
                    if (err) { return next(err); }

                    // We are sending the payload inside the token
                    var token = jwt.sign(escaped, config.secret, { });
                    var registRedirect='/user/register-user-info';
                    res.json({
                      token: token,
                        user:user,
                      redirect: registRedirect
                    });
                });
                res.status(200);
            });
        },
        /**
         * Send User
         */
        me: function(req, res) {
            if (!req.user || !req.user['_id']) return res.send(null);

            User.findOne({
                _id: req.user._id
            }).exec(function(err, user) {

                if (err || !user) return res.send(null);


                //update visited
                if(!user.visited ){
                    user.visited=[Date.now()];
                }else{
                    user.visited.push(Date.now());
                }
                if(user.visited.length>100){
                    user.visited.shift();
                }
                user.save(function (err) {
                    if(err){
                        console.log("update visited err:",err);
                    }

                });
                var dbUser = user.toJSON();
                var id = req.user._id;

                delete dbUser._id;
                delete req.user._id;

                var eq = _.isEqual(dbUser, req.user);
                if (eq) {
                    req.user._id = id;
                    return res.json(req.user);
                }

                // var payload = user;
                var payload = {
                    _id:user._id,
                    username:user.username,
                    name:user.name,
                    // password:user.password,
                    userType:user.userType,
                    mobile:user.mobile,
                    roles:req.user.roles
                };
                var escaped = JSON.stringify(payload);
                escaped = encodeURI(escaped);
                var token = jwt.sign(escaped, config.secret, { });

                
                res.json({ token: token,user:user });

            });
        },

        /**
         * Find user by id
         */
        user: function(req, res, next, id) {
            User.findOne({
                _id: id
            }).exec(function(err, user) {
                if (err) return next(err);
                if (!user) return next(new Error('Failed to load User ' + id));
                req.profile = user;
                next();
            });
        },


        /**
         * Find user by id
         */
        userById: function(req, res) {
            User.findOne({
                _id: req.query.userId
            }).exec(function(err, user) {
                if (err){
                    return res.status(400).json({result:0,data:err});
                }
                return res.status(200).json({result:1,data:user} );
            });
        },

        /**
         * Resets the password
         */

        resetpassword: function(req, res, next) {
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: {
                    $gt: Date.now()
                }
            }, function(err, user) {
                if (err) {
                    return res.status(400).json({
                        msg: err
                    });
                }
                if (!user) {
                    return res.status(400).json([{
                        msg: '身份验证失败，或已经超时'
                    }]);
                }
                req.assert('password', '密码长度需要在4～20个字符之间').len(4, 20);
                req.assert('confirmPassword', '输入的两次密码不一致').equals(req.body.password);
                var errors = req.validationErrors();
                if (errors) {
                    return res.status(400).send(errors);
                }
                user.password = req.body.password;
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                user.save(function(err) {

                    // MeanUser.events.publish({
                    //     action: 'reset_password',
                    //     user: {
                    //         name: user.name
                    //     }
                    // });

                    req.logIn(user, function(err) {
                        if (err) return next(err);
                        return res.send({
                            user: user,
                            redirect:'/auth/login'
                        });
                    });
                });
            });
        },
        /**
         * login in by mobile
         */
        changePasswordByMobile:function (req,res,next) {
            async.waterfall([
                function (callback) {
                    var mobile = req.body.mobile;
                    var code=req.body.mobile_code;
                    if(!mobile || !code) return callback([{msg:'手机验证失败',param:'mobile',value:mobile}]);
                    code = mobile.toString()+"+"+code.toString();
                    // req.session.mobileCode=code;
                    if (req.session.mobileCode!== code) {
                        return callback([{msg:'手机验证失败',param:'mobile',value:mobile}]);
                    }
                    User.findOne({username:req.body.username,mobile:mobile},function (err,user) {
                        if(user){
                            user.resetPasswordToken = code;
                            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                            user.save(function(err) {
                                callback(err, user);
                            });
                        }else{
                            callback(err,user);
                        }

                    });
                },
                function (user,callback) {
                    callback(null,user.resetPasswordToken)
                }
            ],function (err,result) {
                if(err) {
                    return res.status(400).json(err);
                }
                res.json({token:result,redirect:'reset-password'});

            });
        },
        /**
         * Callback for forgot password link
         */
        forgotpassword: function(req, res, next) {
            async.waterfall([

                function(done) {
                    crypto.randomBytes(20, function(err, buf) {
                        var token = buf.toString('hex');
                        done(err, token);
                    });
                },
                function(token, done) {
                    User.findOne({
                        $or: [{
                            email: req.body.text
                        }, {
                            username: req.body.text
                        }]
                    }, function(err, user) {
                        if (err || !user) return done(true);
                        done(err, user, token);
                    });
                },
                function(user, token, done) {
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                    user.save(function(err) {
                        done(err, token, user);
                    });
                },
                function(token, user, done) {
                    var mailOptions = {
                        to: user.email,
                        from: config.emailFrom
                    };
                    mailOptions = templates.forgot_password_email(user, req, token, mailOptions);
                    sendMail(mailOptions);
                    done(null, user);
                }
            ],
            function(err, user) {

                var response = {
                    message: 'Mail successfully sent',
                    status: 'success'
                };
                if (err) {
                    response.message = 'User does not exist';
                    response.status = 'danger';

                }
                // MeanUser.events.publish({
                //     action: 'forgot_password',
                //     user: {
                //         name: req.body.text
                //     }
                // });
                res.json(response);
            });
        },
/*
        修改用户信息
*/
        editUser:function(req,res,next){
            var user=req.user;
            // console.log("test user:",user);
            var newUser=req.body.user;
            if(newUser.profile.certification && newUser.profile.certification!=user.profile.certification){
                newUser.profile.certificationStatus="等待审核";

            }
            //update classes
            if(req.body.update && req.body.update=='classes'){
                req.user.profile.classes=req.user.profile.classes || [];
                newUser.profile.classes=newUser.profile.classes || [];
                var removeClasses=_.differenceBy(req.user.profile.classes,newUser.profile.classes,'classId');
                var newClasses=_.differenceBy(newUser.profile.classes,req.user.profile.classes,'classId');
                var userInfo={
                    name:req.user.name || req.user.username,
                    username:req.user.username,
                    userId:req.user._id.toString(),
                    userType:req.user.userType,
                    status:'等待审核'
                };
                if(removeClasses.length>0){
                    var classes=require('../../../../custom/classes/server/controllers/classes')();
                    classes.removeMemberFromClasses(removeClasses,userInfo);
                }
                if(newClasses.length>0){
                    var classes=require('../../../../custom/classes/server/controllers/classes')();
                    classes.addMemberToClasses(newClasses,userInfo);
                }
            }
            // newUser.profile = _.extend(user.profile, newUser.profile);
            var namePinyin=hz2Pinyin.hanzi_to_pinyin(newUser.name);
            newUser.pinyin=namePinyin.toLowerCase().replace(/\W/ig,'');
            // user.save(function (err) {
            //     if(err) return res.status(400).send("更新失败");
            //     res.json({status:200});
            // });
            user=_.extend(user,newUser); //
            // User.update({_id:req.user._id},{$set:{name:newUser.name,pinyin:newUser.pinyin,profile:newUser.profile}},function(err){
            //     if(err){
            //         res.status(400).json({status:400,err:err});
            //     }
            //     res.json({status:200});
            // });
            user.markModified('profile');
            user.save(function (err) {
                if(err){
                    return res.status(400).json({status:400,err:err});
                }
                res.json({status:200});
            });

        },
        handleImg: function(req, res, next) {
            var companyPath='certification';
            var companyDir=config.root+'/'+config.dataDir+'/'+companyPath;
            var topicPath=companyDir;
            var topicUrl="/"+companyPath;

            async.waterfall([function (callback) {
                fs.exists(companyDir,function (exist) {
                    callback(null,exist);
                });
            },function (exist,callback) {
                if(!exist) {
                    fs.mkdir(companyDir,function (result) {
                        if(result>=0){
                            fs.mkdir(topicPath,function (result) {
                                if(result>=0){
                                    callback(null,'done');
                                }else{
                                    callback('建立目录失败',null);
                                }
                            });
                        }else{
                            callback('建立目录失败',null);
                        }
                    });
                }else{
                    fs.exists(topicPath,function (exist) {
                        if(!exist){
                            fs.mkdir(topicPath,function (result) {
                                if(result>=0){
                                    callback(null,'done');
                                }else{
                                    callback('建立目录失败',null);
                                }
                            });
                        }else{
                            callback(null,'done');
                        }
                    });

                }
            },function (arg,callback) {
                var moveImg=function (str) {
                    var reg=/(\/uploads\/\S+?)$/gi;
                    str=str.replace(reg,function(match,capture){
                        var uploadImg=config.root+"/"+config.dataDir+capture;
                        var imgName=capture.split(/\//);
                        imgName=imgName[imgName.length-1];
                        if(imgName ) {
                            if(fs.existsSync(uploadImg)){
                                var toImg=topicPath+'/'+imgName;
                                try{
                                    var handleCover=fs.renameSync(uploadImg,toImg);
                                }catch (err){
                                    return callback("证书处理失败");
                                }
                                if(handleCover){
                                    callback("证书处理失败");
                                }
                            }
                            return match.replace(capture,topicUrl+"/"+imgName);
                        }
                    });
                    return str;
                };
                if(req.body.user && req.body.user.profile && req.body.user.profile.certification){
                    req.body.user.profile.certification=moveImg(req.body.user.profile.certification);
                }
                callback(null,"done");
            }],function (err,result) {
                if(err){
                    //删除topic
                    // return res.status(400).send(err);
                    console.log("move img err:",err);
                    next();
                }else{
                    //更新topic
                    next();
                }

            });
        },

        // 发送验证码
        send_sms:function(req,res,next){
            var mobile = req.body.mobile;
            var regx = /^(13|15|17|18|14)[0-9]{9}$/;

            if (!mobile || !regx.exec(mobile)) {
                res.status(400).json({status:400,err:'手机号码格式不正确'});
            }

            var apikey = 'dd8b05ca2714ee267a9c963242c48add';

            // 生成4位数字的随机数
            var code = Math.floor(Math.random() * (9999 - 999 + 1) + 999);

            // 短信内容
            var text = '【哈皮虎】您的验证码是' + code;

            // 智能匹配模板发送https地址
            var sms_host = 'sms.yunpian.com';

            // 发送单条短信的地址
            var send_sms_uri = '/v2/sms/single_send.json';

            var post_data = {
                'apikey': apikey,
                'mobile':mobile,
                'text':text,
            };

            // 这是需要提交的数据
            var content = qs.stringify(post_data);

            var options = {
                hostname: sms_host,
                port: 443,
                path: send_sms_uri,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            };

            var req_sms = https.request(options, function (res_sms) {
                res_sms.setEncoding('utf8');
                res_sms.on('data', function (chunk) {
                    req.session.mobileCode= mobile.toString()+'+'+code.toString();    // 必须save session里面的值
                    req.session.save(function(err) {
                        if(err){
                            res.status(400).json({status:400,err:err});
                        } else {
                            res.json({status:200});
                        }
                    });
                });
            });

            req_sms.write(content);
            req_sms.end();
        },

        // 校验验证码
        check_mobileCode:function(req,res,next){
            var mobile = req.body.mobile;
            var regx = /^(13|15|17|18|14)[0-9]{9}$/;
            if (!mobile || !regx.exec(mobile)) {
                return res.status(400).json({status:400,err:'手机号码格式不正确'});
            }
            var code = req.body.code;
            code=mobile.toString()+'+'+code.toString();
            // req.session.mobileCode=code;
            // req.session.save();
            if(req.session.mobileCode == code){
                res.json({status:200});
            } else {
               return res.status(400).json({status:400,err:'手机验证码不正确'});
            }
        },

        // 校验用户名是否存在
        check_userName: function (req, res) {
            var username = req.body.username || ''
            if (username) {
                User.findOne({username: username}, function (err, user) {
                    if (err) res.status(500).json({err: '系统错误'})
                    if (user) {
                        res.status(200).json({flag: 1, msg: '此用户名已经存在'})
                    } else {
                        res.status(200).json({flag: 0, msg: '此用户名可以注册'});
                    }
                })
            }
        }

// /*
//         confirm user ,add roles to user
// */
//         confirmRole:function (req,res,next) {
//             this.user(req,res,next,req.query.userId)
//             if(!req.profile){
//                 res.json({status:400,result:0,data:"用户不存在"});
//             }
//             var roles=req.profile.roles;
//         }
    };
}

