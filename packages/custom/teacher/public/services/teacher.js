(function () {
  'use strict';

  angular
    .module('mean.teacher')
    .factory('Teacher', Teacher);

  Teacher.$inject = ['$resource'];

  function Teacher($resource) {
    return {
      name: 'teacher',
      paperImages:$resource('api/teacher/paperImages/:taskId', {
        taskId: '@_id'
      }, {
        update: {
          method: 'PUT'
        }
      }),
      paperImage:$resource('api/teacher/paperImage/:paperImageId', {
        paperImageId: '@id'
      }, {
        update: {
          method: 'PUT'
        }
      }),
      paperImageUpload:$resource('api/teacher/paperImage/bulkCreate/:taskId', {
        taskId: '@taskId'
      })

    };
  }
})();
