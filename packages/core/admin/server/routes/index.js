'use strict';
var Grid = require('gridfs-stream');
var moment = require('moment');
var crypto = require('crypto');
var _ = require('lodash');
var Url = require('url');
var MD5 = require('md5');
var httpreq = require('httpreq');

// The Package is passed automatically as first parameter
module.exports = function (Admin, app, auth, database) {
    var gfs = new Grid(database.connection.connections[0].db, database.connection.mongo);
    var mean = require('meanio');

    //Setting up the users api
    var users = require('../controllers/users');
    app.get('/api/admin/users', auth.requiresAdmin, users.all);
    app.post('/api/admin/users', auth.requiresLogin, users.create);
    app.get('/api/admin/users/:userId', auth.requiresLogin, users.user);
    app.put('/api/admin/users/:userId', auth.requiresAdmin, users.update);
    app.delete('/api/admin/users/:userId', auth.requiresAdmin, users.destroy);

    //company api
    var companies = require('../controllers/companies')();
    app.get('/api/admin/companies', auth.requiresLogin, companies.all);
    app.post('/api/admin/companies', auth.requiresLogin, auth.requiresAdmin, companies.create);
    app.put('/api/admin/companies/:companyId', auth.requiresLogin, auth.requiresAdmin, companies.update);
    app.delete('/api/admin/companies/:companyId', auth.requiresLogin, auth.requiresAdmin, companies.destroy);
    app.param('companyId', companies.company);

    //Setting up the themes api
    var themes = require('../controllers/themes');
    app.get('/api/admin/themes', auth.requiresAdmin, function (req, res) {
        themes.save(req, res, gfs);
    });

    app.get('/api/admin/themes/defaultTheme', auth.requiresAdmin, function (req, res) {
        themes.defaultTheme(req, res, gfs);
    });

    app.get('/api/admin/modules', auth.requiresAdmin, function (req, res) {
        //var modules = mean.exportable_modules_list;
        //res.jsonp(modules);
        //for (var index in mean.resolved) {
        //   //console.log(mean.resolved);
        //   if (mean.resolved[index].result) console.log(mean.resolved[index].result.loadedmodule);
        //}
    });

    var settings = require('../controllers/settings');
    app.get('/api/admin/settings', auth.requiresAdmin, settings.get);
    app.put('/api/admin/settings', auth.requiresAdmin, settings.save);

    var moduleSettings = require('../controllers/module-settings');
    app.get('/api/admin/moduleSettings/:name', auth.requiresAdmin, moduleSettings.get);
    app.post('/api/admin/moduleSettings/:name', auth.requiresAdmin, moduleSettings.save);
    app.put('/api/admin/moduleSettings/:name', auth.requiresAdmin, moduleSettings.update);
    //系统参数
    var variables = require('../controllers/variables')();
    app.get('/api/admin/variables', variables.all);
    app.post('/api/admin/variables', auth.requiresLogin, auth.requiresAdmin, variables.create);
    app.get('/api/admin/variables/:varName', variables.show);
    app.put('/api/admin/variables/:varName', auth.requiresLogin, auth.requiresAdmin, variables.update);
    app.delete('/api/admin/variables/:varName', auth.requiresLogin, auth.requiresAdmin, variables.destroy);
    app.param('varName', variables.variable);
    //系统管理
    var system = require('../controllers/system');
    app.get('/api/admin/initZones', auth.requiresAdmin, system.initZones);
    app.post('/api/admin/addSchool', auth.requiresAdmin, system.addSchool);
    app.put('/api/admin/saveSchool/:schoolId', auth.requiresLogin, system.saveSchool);
    app.delete('/api/admin/deleteSchool', auth.requiresAdmin, system.deleteSchool);
    app.param('schoolId', system.school);

    //测试
    app.get('/api/test/qiujieda/exercises', function (req, res) {
        var access = '2fd54757-60ed-49d3-a454-fbcf7f024fa0';
        var secrect = 'b569f2b0-b330-4975-96ed-3ca7baaeaff2';
        var timestamp = new Date().getTime();
        var params = {
            accessKey: access,
            gradeId: req.query.gradeId || null,
            hard: req.query.hard || null,
            kpId: req.query.kpId || null, //平均数的含义及求平均数的方法
            pageNum: req.query.pageNum || null,
            pageSize: req.query.pageSize || null,
            sortBy: req.query.sortBy || null,
            subjectId: req.query.subjectId || null,
            timestamp: timestamp,
            typeId: req.query.typeId || null
        }
        var url = Url.parse('http://apiservice.qiujieda.com:8080/qiujieda-yousi-service/ys/exercise/getExercises');
        var str = '';
        var i = 0;
        var queryString = '?';
        _.forEach(params, function (value, key) {
            if (value) {
                str += key + '=' + value;
                var link = (i !== 0) ? '&' : '';
                i++;
                queryString += link + key + '=' + value;
            }
        });
        var host = "apiservice.qiujieda.com";
        var sign = 'GET' + host + url.path + str + secrect;
        // console.log("not md5:",sign);
        sign = MD5(sign);
        params.sign = sign;
        var len = 32 - sign.length;
        for (var i = 0; i < len; i++) {
            sign = '0' + sign;
        }
        url = url.href + queryString + '&sign=' + sign;
        console.log("---------visit qiujieda-----------:", url);
        httpreq.get(url, function (err, response) {
            if (err) {
                console.log("err:", err);
                return res.status(500).send('访问求解答失败');
            }
            console.log(response.statusCode);
            console.log(response.body);
            console.log(response.cookies);
            res.json({result: 1, data: {original: response.body}});
        });
    });
    app.get('/api/test/qiujieda/exercise', function (req, res) {
        var access = '2fd54757-60ed-49d3-a454-fbcf7f024fa0';
        var secrect = 'b569f2b0-b330-4975-96ed-3ca7baaeaff2';

        var timestamp = new Date().getTime();
        if (!req.query.id) {
            return res.status(400).send("缺少id");
        }
        var params = {
            accessKey: access,
            id: req.query.id,
            timestamp: timestamp,
        }
        var url = Url.parse('http://apiservice.qiujieda.com:8080/qiujieda-yousi-service/ys/exercise/getExercise');
        var str = '';
        var i = 0;
        var queryString = '?';
        _.forEach(params, function (value, key) {
            if (value) {
                str += key + '=' + value;
                var link = (i !== 0) ? '&' : '';
                i++;
                queryString += link + key + '=' + value;
            }
        });
        var host = "apiservice.qiujieda.com";
        var sign = 'GET' + host + url.path + str + secrect;
        // console.log("not md5:",sign);
        sign = MD5(sign);
        params.sign = sign;
        var len = 32 - sign.length;
        for (var i = 0; i < len; i++) {
            sign = '0' + sign;
        }
        url = url.href + queryString + '&sign=' + sign;
        console.log("---------visit qiujieda-----------:", url);
        httpreq.get(url, function (err, response) {
            if (err) {
                console.log("err:", err);
                return res.status(500).send('访问求解答失败');
            }
            console.log(response.statusCode);
            console.log(response.body);
            console.log(response.cookies);
            res.json({result: 1, data: {original: response.body}});
        });
    });
    app.get('/api/test/qiujieda/papers', function (req, res) {
        var access = '2fd54757-60ed-49d3-a454-fbcf7f024fa0';
        var secrect = 'b569f2b0-b330-4975-96ed-3ca7baaeaff2';

        var timestamp = new Date().getTime();
        var params = {
            accessKey: access,
            cityId: req.query.cityId || null,
            gradeId: req.query.gradeId || null,
            isContest: req.query.isContest || 0,
            isGeneral: req.query.isGeneral || 0,
            isSchool: req.query.isSchool || 0,
            pageNum: req.query.pageNum || null,
            pageSize: req.query.pageSize || null,
            provinceId: req.query.provinceId || null,
            sortBy: req.query.sortBy || null,
            subjectId: req.query.subjectId || null,
            timestamp: timestamp,
            typeId: req.query.typeId || null,
            year: req.query.year || null,

        }
        var url = Url.parse('http://apiservice.qiujieda.com:8080/qiujieda-yousi-service/ys/paper/getPapers');
        var str = '';
        var i = 0;
        var queryString = '?';
        _.forEach(params, function (value, key) {
            if (value) {
                str += key + '=' + value;
                var link = (i !== 0) ? '&' : '';
                i++;
                queryString += link + key + '=' + value;
            }
        });
        var host = "apiservice.qiujieda.com";
        var sign = 'GET' + host + url.path + str + secrect;
        // console.log("not md5:",sign);
        sign = MD5(sign);
        params.sign = sign;
        var len = 32 - sign.length;
        for (var i = 0; i < len; i++) {
            sign = '0' + sign;
        }
        url = url.href + queryString + '&sign=' + sign;
        console.log("---------visit qiujieda-----------:", url);
        httpreq.get(url, function (err, response) {
            if (err) {
                console.log("err:", err);
                return res.status(500).send('访问求解答失败');
            }
            console.log(response.statusCode);
            console.log(response.body);
            console.log(response.cookies);
            res.json({result: 1, data: {original: response.body}});
        });
    });
    app.get('/api/test/qiujieda/paper', function (req, res) {
        var access = '2fd54757-60ed-49d3-a454-fbcf7f024fa0';
        var secrect = 'b569f2b0-b330-4975-96ed-3ca7baaeaff2';

        var timestamp = new Date().getTime();
        if (!req.query.id) {
            return res.status(400).send("缺少id");
        }
        var params = {
            accessKey: access,
            id: req.query.id,
            timestamp: timestamp,
        }
        var url = Url.parse('http://apiservice.qiujieda.com:8080/qiujieda-yousi-service/ys/paper/getPaper');
        var str = '';
        var i = 0;
        var queryString = '?';
        _.forEach(params, function (value, key) {
            if (value) {
                str += key + '=' + value;
                var link = (i !== 0) ? '&' : '';
                i++;
                queryString += link + key + '=' + value;
            }
        });
        var host = "apiservice.qiujieda.com";
        var sign = 'GET' + host + url.path + str + secrect;
        // console.log("not md5:",sign);
        sign = MD5(sign);
        params.sign = sign;
        var len = 32 - sign.length;
        for (var i = 0; i < len; i++) {
            sign = '0' + sign;
        }
        url = url.href + queryString + '&sign=' + sign;
        console.log("---------visit qiujieda-----------:", url);
        httpreq.get(url, function (err, response) {
            if (err) {
                console.log("err:", err);
                return res.status(500).send('访问求解答失败');
            }
            console.log(response.statusCode);
            console.log(response.body);
            console.log(response.cookies);
            res.json({result: 1, data: {original: response.body}});
        });
    });



};


