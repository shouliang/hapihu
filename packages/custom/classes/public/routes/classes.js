(function () {
  'use strict';

  angular
    .module('mean.classes')
    .config(classes);

  classes.$inject = ['$stateProvider'];

  function classes($stateProvider) {
    $stateProvider.state('admin classes', {
      url: '/admin/classes',
      templateUrl: 'classes/views/admin/index.html'
    })
    .state('all classes', {
      url: '/admin/classList',
      templateUrl: 'classes/views/admin/list.html'
    })
    .state('manage class', {
      url: '/manage/class/:classId',
      templateUrl: 'classes/views/manage/class.html'
    })
    .state('edit class', {
      url: '/manage/editClass/:classId',
      templateUrl: 'classes/views/manage/edit.html'
    })
    .state('join class', {
      url: '/myclasses/join_class',
      templateUrl: 'classes/views/join-class.html'
    })
    .state('my classes', {
      url: '/myclasses?classId',
      templateUrl: 'classes/views/my-classes.html'
    })
    .state('manage school', {
      url: '/manage/school/:id',
      templateUrl: 'classes/views/manage/school.html'
    })
    ;
  }

})();
