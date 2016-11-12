(function () {
  'use strict';
  angular
    .module('mean.notification')
    .config(notification);
  notification.$inject = ['$stateProvider'];
  function notification($stateProvider) {
    $stateProvider.state('my notification', {
      url: '/myNotification',
      templateUrl: 'notification/views/index.html'
    })
    .state('parent notification', {
      url: '/parentNotification',
      templateUrl: 'notification/views/parentNotification.html'
    })
    .state('parent-teacher sendMessage', {
      url: '/sendMessage/:messageFromId?messageFromName&page&pageItem',
      templateUrl: 'notification/views/sendMessage.html'
    });
  }
})();
