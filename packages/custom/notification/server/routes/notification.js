(function () {
  'use strict';

  /* jshint -W098 */
  // The Package is past automatically as first parameter
  module.exports = function (Notification, app, auth, database) {
    var notification=require("../controllers/notification")(Notification);

    app.get('/api/user/new_notification',auth.requiresLogin,notification.newNotification);

    app.get('/api/user/readed_notification',auth.requiresLogin,notification.clearNewNotification);

    app.get('/api/user/notification',auth.requiresLogin,notification.myNotification);

    app.post('/api/user/notification/create',notification.create);

    app.post('/api/user/notification/sendMsg',notification.sendMsg);

    app.get('/api/user/notification/myNotificationWithOne',notification.myNotificationWithOne);

    app.get('/api/user/notification/groupFrom',notification.groupByFrom);

  };
})();
