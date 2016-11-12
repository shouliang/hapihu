(function () {
  'use strict';

  angular
    .module('mean.notification')
    .factory('Notification', Notification);

  Notification.$inject = ['$resource'];

  function Notification($resource) {
    return {
      name: 'notification',
      notification:$resource('api/user/notification',{
        
      },{
        
      }),
      sendMsg:$resource('/api/user/notification/sendMsg/',{
      },{
        update: {
          method:'POST'
        }
      }),
      msgList:$resource('/api/user/notification/myNotificationWithOne',{},{}),//互发消息
      msgTeacherList:$resource('/api/user/notification/groupFrom',{},{}),//老师端按照用户展示消息
      getUserById:$resource('/api/users/userId',{},{})
    };
  }
})();
