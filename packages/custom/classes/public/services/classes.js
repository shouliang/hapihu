(function () {
  'use strict';

  angular
    .module('mean.classes')
    .factory('Classes', Classes);

  Classes.$inject = ['$resource'];

  function Classes($resource) {
    return {
      name: 'classes',
      klass:$resource('api/class/:classId', {
        classId: '@classId'
      }, {
        update: {
          method: 'PUT'
        }
      }),
      school:$resource('api/user/schools', {

      }, {
        add:{
          method:'POST'
        }
      }),
      userClass:$resource('api/user/classes', {

      }, {
        add:{
          method:'POST'
        }
      }),
      schoolInfo:$resource('api/get-school')
    };
  }
})();
