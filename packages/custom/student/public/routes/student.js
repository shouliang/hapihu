(function () {
  'use strict';

  angular
    .module('mean.student')
    .config(student);

  student.$inject = ['$stateProvider'];

  function student($stateProvider) {
    $stateProvider.state('student', {
      url: '/student',
      templateUrl: 'student/views/index.html'
    })
    .state('student collectionNotebook', {
       url: '/student/collectionNotebook', 
       templateUrl: 'student/views/collectionNotebook.html'
    });
  }

})();
