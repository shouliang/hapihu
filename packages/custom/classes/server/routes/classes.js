(function () {
  'use strict';

  /* jshint -W098 */
  // The Package is past automatically as first parameter
  var hasAuthorization = function(req, res, next) {
    // if (!req.user.isAdmin ) {
    //   return res.status(401).send('User is not authorized');
    // }
    next();
  };
  var hasPermissions = function(req, res, next) {

    if(req.user.roles.indexOf['admin']===-1 && req.user.roles.indexOf['vendor']===-1 && req.user.roles.indexOf['organization']===-1){
      return res.status(401).send('抱歉，你没有权限访问此页面');
    }
    next();
  };

  module.exports = function (Classes, app, auth, database) {
    var classes=require('../controllers/classes')();
    app.get('/api/class', hasAuthorization,hasPermissions,classes.all);
    app.get('/api/class/:classId', hasAuthorization,hasPermissions,classes.show);
    app.post('/api/class/:classId', hasAuthorization,hasPermissions,classes.update);
    app.delete('/api/class/:classId', hasAuthorization,hasPermissions,classes.delete);
    app.put('/api/class/:classId', hasAuthorization,hasPermissions,classes.updateMembers);
    app.param('classId', classes.cclass);

    app.post('/api/user/classes', auth.requiresLogin,  classes.create);
    app.get('/api/user/myClasses',auth.requiresLogin,classes.myClasses);
    app.post('/api/user/joinClass/:classId',auth.requiresLogin,classes.joinClass);
    app.post('/api/user/joinClass/',auth.requiresLogin,classes.joinClass);

    // 培训结构用户 直接添加学生到班级
    app.post('/api/class/classMember/:classId',auth.requiresLogin,classes.addMembers);

    var schools=require('../controllers/schools')();
    app.get('/api/user/schools', auth.requiresLogin,  schools.all);
    app.post('/api/user/schools', auth.requiresLogin,  schools.create);
    app.param('schoolId',schools.school);
  };

})();
