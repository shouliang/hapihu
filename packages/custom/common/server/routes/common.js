(function () {
  'use strict';

  /* jshint -W098 */
  // The Package is past automatically as first parameter
  module.exports = function (Common, app, auth, database) {
    var index = require('../controllers/index')(Common);
    app.get('/api/get-schools', index.searchSchools);
    app.get('/api/get-school', index.getSchool);
    app.get('/api/get-zones',index.getZones);

    app.post('/api/upload',auth.requiresLogin,index.upload);

    app.get('/api/common/example/auth', auth.requiresLogin, function (req, res, next) {
      res.send('Only authenticated users can access this');
    });

    app.get('/api/common/example/admin', auth.requiresAdmin, function (req, res, next) {
      res.send('Only users with Admin role can access this');
    });

    app.get('/api/common/example/render', function (req, res, next) {
      Common.render('index', {
        package: 'common'
      }, function (err, html) {
        //Rendering a view from the Package server/views
        res.send(html);
      });
    });
  };
})();
