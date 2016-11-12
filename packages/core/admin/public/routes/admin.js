'use strict';
angular.module('mean.admin').config(['$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('admin',{
          url:'/admin',
          templateUrl: 'admin/views/index.html'
        })
      .state('users', {
        url: '/admin/users?:userType&zone&:username&:name&:page&:pageItem',
        templateUrl: 'admin/views/users.html',
        requiredCircles: {
          circles: ['admin']
        }
      }).state('users-addUser', {
        url: '/admin/users/addUser',
        templateUrl: 'admin/views/users-user.html',
        requiredCircles: {
          circles: ['admin']
        },
        controller:'UsersUserController as vm'
    }).state('users-user', {
        url: '/admin/users/:userId',
        templateUrl: 'admin/views/users-user.html',
        requiredCircles: {
          circles: ['admin']
        },
        controller:'UsersUserController as vm'
      }).state('themes', {
        url: '/admin/themes',
        templateUrl: 'admin/views/themes.html',
        requiredCircles: {
          circles: ['admin']
        }
      }).state('settings', {
        url: '/admin/settings',
        templateUrl: 'admin/views/settings.html',
        requiredCircles: {
          circles: ['admin']
        }
      }).state('modules', {
        url: '/admin/modules',
        templateUrl: 'admin/views/modules.html',
        requiredCircles: {
          circles: ['admin']
        }
      }).state('system', {
        url: '/admin/system',
        templateUrl: 'admin/views/system.html',
        requiredCircles: {
          circles: ['admin']
        },
        abstract: true,
      }).state('system.base',{
        url: '/base',
        templateUrl: 'admin/views/system-base.html',
      }).state('system.companies',{
      url: '/companies',
      templateUrl: 'admin/views/system-companies.html',
    }).state('system.schools',{
      url: '/schools',
      templateUrl: 'admin/views/system-schools.html',
    }).state('system.zones',{
      url: '/zones',
      templateUrl: 'admin/views/system-zones.html',
    }).state('school',{
      url:'/admin/school/:id',
      templateUrl:'admin/views/school.html'
    }).state('admin qiujieda',{
        url:'/admin/test/qiujieda',
        templateUrl:'admin/views/test/qiujieda.html'
    })
    ;
  }
  ]).config(['ngClipProvider',
      function(ngClipProvider) {
          ngClipProvider.setPath('../admin/assets/lib/zeroclipboard/dist/ZeroClipboard.swf');
      }
  ]);