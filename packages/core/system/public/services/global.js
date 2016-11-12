'use strict';

//Global service for global variables
angular.module('mean.system').factory('Global', ['$state',
  function($state) {
    var _this = this;
    _this._data = {
      user: window.user,
      authenticated: false,
      isAdmin: false,
      sysVersion:{
        astudy:{
          name:'Astudy目标学习系统',
          subName:'AIM STUDY SYSTEM',
          logo:'/theme/assets/img/logo-astudy.png',
          bodyClass:'astudy',
          banner:'/theme/assets/img/banner-astudy.png'
        },
        fudaoyi:{
          name:'辅导易',
          subName:'FU DAO YI',
          logo:'/theme/assets/img/logo-fudaoyi.png',
          bodyClass:'fudaoyi',
          banner:'/theme/assets/img/banner-fudaoyi.png',
          forbidRegist:true
        }
      }
    };
    if (window.user && window.user.roles) {
      _this._data.authenticated = window.user.roles.length;
      _this._data.isAdmin = window.user.roles.indexOf('admin') !== -1;
    }
    return _this._data;
  }
]);
