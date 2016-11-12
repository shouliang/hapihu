


(function(){
  'use strict';

  angular
      .module('mean.articles')
      .factory('Articles', Articles);

  Articles.$inject = ['$resource','$http'];

//Articles service used for articles REST endpoint

  function Articles($resource,$http) {
    return {
      feedback:$resource('api/user/notification/create', {

      }, {
        save: {
          method: 'POST'
        }
      })
    }
  }

})();
