'use strict';

angular
    .module('mean.books')
    .factory('KnowledgeSystem', function($resource,$http) {
      return {
        knowledgeSystem:$resource('api/vendor/knowledgeSystem/:knowledgeSystemId', {
        }, {
          query: {
            method: 'GET',
            isArray:false
          },
          update:{
            method:'PUT'
          }

        }),
        knowledge:$resource('api/knowledge/:knowledgeId', {
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