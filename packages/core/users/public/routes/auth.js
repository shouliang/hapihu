'use strict';

//Setting up route
angular.module('mean.users').config(['$meanStateProvider', '$httpProvider', 'jwtInterceptorProvider',
  function($meanStateProvider, $httpProvider, jwtInterceptorProvider) {    
        
    jwtInterceptorProvider.tokenGetter = function() {
      return localStorage.getItem('JWT');
    };

    $httpProvider.interceptors.push('jwtInterceptor');

    // states for my app
    $meanStateProvider
      .state('auth', {
        url: '/auth',
        abstract: true,
        templateUrl: 'users/views/index.html'
      })
      .state('auth.login', {
        url: '/login',
        templateUrl: 'users/views/login.html',
        resolve: {
          loggedin: function(MeanUser) {
            return MeanUser.checkLoggedOut();
          }
        }
      })
      .state('auth.register', {
        url: '/register',
        templateUrl: 'users/views/register.html',
        resolve: {
          loggedin: function(MeanUser) {
            return MeanUser.checkLoggedOut();
          }
        }
      })
      .state('forgot-password', {
        url: '/forgot-password',
        templateUrl: 'users/views/forgot-password.html',
        resolve: {
          loggedin: function(MeanUser) {
            return MeanUser.checkLoggedOut();
          }
        }
      })
      .state('reset-password', {
        url: '/reset/:tokenId',
        templateUrl: 'users/views/reset-password.html',
        resolve: {
          loggedin: function(MeanUser) {
            return MeanUser.checkLoggedOut();
          }
        }
        
      })
    .state('user change password',{
      url:'/user/changePassword',
      templateUrl:'users/views/profile-changePassWord.html'
    })
    .state('user profile',{
      url:'/user/profile',
      templateUrl:'users/views/profile.html'
    })
    .state('user-info',{
      url:'/user/user-info',
      templateUrl:'users/views/user-info.html'
    })
    .state('register user-info',{
      url:'/user/register-user-info',
      templateUrl:'users/views/register-user-info.html'
    })
    .state('profile teacher resource',{
      url:'/user/teacher-resource',
      templateUrl:'users/views/teacher-resource.html'
    });
    
  }
]);
