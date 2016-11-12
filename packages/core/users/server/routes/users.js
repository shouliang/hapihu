'use strict';

var config = require('meanio').loadConfig();
var jwt = require('jsonwebtoken'); //https://npmjs.org/package/node-jsonwebtoken
var session = require('express-session');

module.exports = function (MeanUser, app, auth, database, passport) {


    // User routes use users controller
    var users = require('../controllers/users')(MeanUser);

    var loginPage = config.public.loginPage;

    app.route('/api/logout')
        .get(users.signout);
    app.route('/api/users/me')
        .get(users.me);

    // Setting up the userId param
    app.param('userId', users.user);

    app.route('/api/users/userId')
        .get(users.userById);

    // AngularJS route to check for authentication
    app.route('/api/loggedin')
        .get(function (req, res) {
            if (!req.isAuthenticated()) return res.send('0');
            auth.findUser(req.user._id, function (user) {
                res.send(user ? user : '0');
            });
        });

    // 发送验证码
    app.post('/api/users/send-sms', users.send_sms);

    // 校验验证码
    app.post('/api/users/check-mobileCode', users.check_mobileCode);

    // 校验用户名
    app.post('/api/users/checkUserName', users.check_userName);

    if (config.strategies.local.enabled) {
        // Setting up the users api
        app.route('/api/register')
            .post(users.create);

        app.route('/api/forgot-password')
            .post(users.changePasswordByMobile);

        app.route('/api/reset/:token')
            .post(users.resetpassword);

        // Setting the local strategy route
        app.route('/api/login')
            .post(passport.authenticate('local', {
                failureFlash: false
            }), function (req, res) {
                // var payload = req.user;
                var payload = {
                    _id: req.user._id,
                    username: req.user.username,
                    name: req.user.name,
                    // password:req.user.password,
                    userType: req.user.userType,
                    mobile: req.user.mobile,
                    roles: req.user.roles
                };
                var escaped = JSON.stringify(payload);
                escaped = encodeURI(escaped);
                // We are sending the payload inside the token
                var token = jwt.sign(escaped, config.secret, {});

                // var postfix=req.user.userType+"/";
                res.json({
                    token: token,
                    user: req.user,
                    redirect: req.body.redirect || config.strategies.landingPage
                });
            });

    }
    // app.route('/api/users/edit')
    app.post('/api/users/edit', auth.requiresLogin, users.handleImg, users.editUser);
    // app.get('/api/user/myClasses',auth.requiresLogin,users.myClasses);

    // AngularJS route to get config of social buttons
    app.route('/api/get-config')
        .get(function (req, res) {
            // To avoid displaying unneccesary social logins
            var strategies = config.strategies;
            var configuredApps = {};
            for (var key in strategies) {
                if (strategies.hasOwnProperty(key)) {
                    var strategy = strategies[key];
                    if (strategy.hasOwnProperty('enabled') && strategy.enabled === true) {
                        configuredApps[key] = true;
                    }
                }
            }
            res.send(configuredApps);
        });

    if (config.strategies.facebook.enabled) {
        // Setting the facebook oauth routes
        app.route('/api/auth/facebook')
            .get(passport.authenticate('facebook', {
                scope: ['email', 'user_about_me'],
                failureRedirect: loginPage,
            }), users.signin);

        app.route('/api/auth/facebook/callback')
            .get(passport.authenticate('facebook', {
                failureRedirect: loginPage,
            }), users.authCallback);
    }

    if (config.strategies.github.enabled) {
        // Setting the github oauth routes
        app.route('/api/auth/github')
            .get(passport.authenticate('github', {
                failureRedirect: loginPage
            }), users.signin);

        app.route('/api/auth/github/callback')
            .get(passport.authenticate('github', {
                failureRedirect: loginPage
            }), users.authCallback);
    }

    if (config.strategies.twitter.enabled) {
        // Setting the twitter oauth routes
        app.route('/api/auth/twitter')
            .get(passport.authenticate('twitter', {
                failureRedirect: loginPage
            }), users.signin);

        app.route('/api/auth/twitter/callback')
            .get(passport.authenticate('twitter', {
                failureRedirect: loginPage
            }), users.authCallback);
    }

    if (config.strategies.google.enabled) {
        // Setting the google oauth routes
        app.route('/api/auth/google')
            .get(passport.authenticate('google', {
                failureRedirect: loginPage,
                scope: [
                    'https://www.googleapis.com/auth/userinfo.profile',
                    'https://www.googleapis.com/auth/userinfo.email'
                ]
            }), users.signin);

        app.route('/api/auth/google/callback')
            .get(passport.authenticate('google', {
                failureRedirect: loginPage
            }), users.authCallback);
    }

    if (config.strategies.linkedin.enabled) {
        // Setting the linkedin oauth routes
        app.route('/api/auth/linkedin')
            .get(passport.authenticate('linkedin', {
                failureRedirect: loginPage,
                scope: ['r_emailaddress']
            }), users.signin);

        app.route('/api/auth/linkedin/callback')
            .get(passport.authenticate('linkedin', {
                failureRedirect: loginPage
            }), users.authCallback);
    }

};
