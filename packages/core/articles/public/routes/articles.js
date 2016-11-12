'use strict';

//Setting up route
angular.module('mean.articles').config(['$stateProvider',
  function($stateProvider) {

    // states for my app
    $stateProvider
      .state('footer aboutUs', {
        url: '/aboutUs',
        templateUrl: '/articles/views/aboutUs.html'
      })
      .state('header feedback', {
        url: '/feedback',
        templateUrl: '/articles/views/feedback.html'
      })
      .state('footer contactUs', {
        url: '/contactUs',
        templateUrl: '/articles/views/contactUs.html'
      })
      .state('footer help', {
        url: '/help',
        templateUrl: '/articles/views/help.html'
      })
      .state('create article', {
        url: '/articles/create',
        templateUrl: '/articles/views/create.html',
        requiredCircles : {
          circles: ['can create content'],
          denyState: 'auth.login'
        }
      })
      .state('edit article', {
        url: '/articles/:articleId/edit',
        templateUrl: '/articles/views/edit.html',
        requiredCircles : {
          circles: ['can edit content']
        }
      })
      .state('article by id', {
        url: '/articles/:articleId',
        templateUrl: '/articles/views/view.html',
        requiredCircles : {
          circles: ['authenticated'],
          denyState: 'auth.login'
        }
      })
    ;
  }
]);
