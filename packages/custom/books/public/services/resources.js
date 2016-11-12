  'use strict';

  angular
    .module('mean.books')
    .factory('Resources', function($resource,$http) {
    return {
      vendorResource:$resource('api/vendor/resource/:resourceId', {
        resourceId: '@resourceId'
        }, {
          query: {
            method: 'GET',
            isArray:false
          },
          update:{
            method:'PUT'
          }

        }),
      resource:$resource('api/vendor/resource/:resourceId', {
        resourceId: '@resourceId'
      }, {
        query: {
          method: 'GET',
          isArray:false
        },
        update:{
          method:'PUT'
        }

      }),
    };
  });

