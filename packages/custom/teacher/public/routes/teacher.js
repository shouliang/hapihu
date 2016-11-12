(function () {
  'use strict';

  angular
    .module('mean.teacher')
    .config(teacher);

  teacher.$inject = ['$stateProvider'];

  function teacher($stateProvider) {
    $stateProvider.state('teacher', {
      url: '/teacher',
      templateUrl: 'teacher/views/index.html'
    });
    $stateProvider.state('unioner', {
      url: '/unioner',
      templateUrl: 'teacher/views/unioner/index.html'
    });
    $stateProvider.state('schooler', {
      url: '/schooler',
      templateUrl: 'teacher/views/schooler/index.html'
    })
    .state('teacher paper', {
      url: '/teacher/paper?paperId&path',
      templateUrl: 'teacher/views/unioner/paper.html'
    })
    .state('paper setting', {
      url: '/paper/setting/:taskId',
      templateUrl: 'teacher/views/unioner/paper-setting.html'
    })
    .state('paper upload', {
      url: '/paper/upload/:taskId',
      templateUrl: 'teacher/views/unioner/paper-upload.html'
    });
  }

})();
