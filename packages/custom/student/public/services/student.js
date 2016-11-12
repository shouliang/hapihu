(function () {
  'use strict';

  angular
    .module('mean.student')
    .factory('Student', Student);

  Student.$inject = ['$resource'];

  function Student($resource) {
    return {
      name: 'student',
      collectionNotebook:$resource('api/myAnswer/errors/', {
          
      }, {
          update: {
              method: 'PUT'
          }
      })
    };
  }
})();
