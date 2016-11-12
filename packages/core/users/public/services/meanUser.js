'use strict';

angular.module('mean.users').factory('MeanUser', [ '$rootScope', '$http', '$location', '$stateParams', '$cookies', '$q', '$timeout', '$meanConfig',
  function($rootScope, $http, $location, $stateParams, $cookies, $q, $timeout, $meanConfig) {

    var self;

    function escape(html) {
      return String(html)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function b64_to_utf8( str ) {
      return decodeURIComponent(escape(window.atob( str )));
    }

    /*function url_base64_decode(str) {
      var output = str.replace('-', '+').replace('_', '/');
      switch (output.length % 4) {
      case 0:
      break;
      case 2:
      output += '==';
      break;
      case 3:
      output += '=';
      break;
      default:
      throw 'Illegal base64url string!';
      }
      return window.atob(output); //polifyll https://github.com/davidchambers/Base64.js
    }*/

    /**
     * get new notification
     *
       */
    var timer;
    function newNotification(user) {
      if(timer) $timeout.cancel(timer);
      timer=$timeout(function () {
        if(!user.newNotifications){
          $http.get('/api/user/new_notification').then(function(res) {
            if(res.data.result){
              user.newNotifications = res.data.data;
            }
          });
        }
        // newNotification(user);
      },1000);
    }

    function MeanUserKlass(){
      this.aclDefer = $q.defer();
      this.name = 'users';
      this.user = {};
      this.acl = this.aclDefer.promise;
      this.registerForm = false;
      this.loggedin = false;
      this.isAdmin = false;
      this.loginError = 0;
      this.usernameError = null;
      this.registerError = null;
      this.resetpassworderror = null;
      this.validationError = null;
      self = this;
      $http.get('/api/users/me').success(function(response) {
        if(!response && $cookies.get('token') && $cookies.get('redirect')) {
          self.onIdentity.bind(self)({
            token: $cookies.get('token'),
            redirect: $cookies.get('redirect').replace(/^"|"$/g, '')
          });
          $cookies.remove('token');
          $cookies.remove('redirect');
        } else {
          self.onIdentity.bind(self)(response);
        }
      });
      this.acl.then(function(response) {
        self.acl = response;
        delete self.aclDefer;
      });
    }

    MeanUserKlass.prototype.onIdentity = function(response) {
      var self = this;

      if (!response) {
        $http.get('/api/circles/mine').success(function(acl) {
          if(self.aclDefer) {
            self.aclDefer.resolve(acl);
          } else {
            self.acl = acl;
          }
        });
        return;
      }
      var encodedUser, user, destination;
      if (angular.isDefined(response.token)) {
        localStorage.setItem('JWT', response.token);
        encodedUser = decodeURI(b64_to_utf8(response.token.split('.')[1]));
        user = JSON.parse(encodedUser);
      }
      if(angular.isDefined(response.user)){
        user = response.user;
      }
      destination = angular.isDefined(response.redirect) ? response.redirect : destination;
      $cookies.remove('redirect');
      this.user = user || response;
      if(this.user && !this.user.profile){
        this.user.profile={};
      }
      this.loggedin = true;
      this.loginError = 0;
      this.registerError = 0;
      this.isAdmin = this.user.roles.indexOf('admin') > -1;
      var userObj = this.user;
      // Add circles info to user
      $http.get('/api/circles/mine').success(function(acl) {
        if(self.aclDefer) {
          self.aclDefer.resolve(acl);
        } else {
          self.acl = acl;
        }
        if (destination) {
          if(destination==='/' && userObj.userType){
            destination='/'+userObj.userType;
          }
          $location.path(destination);
        }
        $rootScope.$emit('loggedin', userObj);
      });

      //get new notificatoin
      // newNotification(this.user);
    };

    MeanUserKlass.prototype.onIdFail = function (response) {
      // $location.path(response.redirect);
      this.loginError = '帐号或密码错误';
      this.registerError = response;
      this.validationError = response.msg;
      this.resetpassworderror = response.msg;
      $rootScope.$emit('loginfailed');
      $rootScope.$emit('registerfailed');
    };

    var MeanUser = new MeanUserKlass();

    MeanUserKlass.prototype.login = function (user) {
      // this is an ugly hack due to mean-admin needs
      var destination = $location.path().indexOf('/login') === -1 ? $location.absUrl() : false;
      $http.post('/api/login', {
          username: user.username,
          password: user.password,
          redirect: $cookies.get('redirect') || destination
        })
        .success(this.onIdentity.bind(this))
        .error(this.onIdFail.bind(this));
    };

    MeanUserKlass.prototype.register = function(user) {
      $http.post('/api/register', {
        mobile: user.mobile,
        mobile_code:user.mobile_code,
        password: user.password,
        confirmPassword: user.confirmPassword,
        username: user.username,
        name: user.name,
        userType:user.userType
      })
        .success(this.onIdentity.bind(this))
        .error(this.onIdFail.bind(this));
    };

    MeanUserKlass.prototype.resetpassword = function(user) {
        $http.post('/api/reset/' + $stateParams.tokenId, {
          password: user.password,
          confirmPassword: user.confirmPassword
        })
          .success(this.onIdentity.bind(this))
          .error(this.onIdFail.bind(this));
      };

    MeanUserKlass.prototype.forgotpassword = function(user) {
        $http.post('/api/forgot-password', {
          text: user.email
        })
          .success(function(response) {
            $rootScope.$emit('forgotmailsent', response);
          })
          .error(this.onIdFail.bind(this));
      };

    MeanUserKlass.prototype.logout = function(){
      this.user = {};
      this.loggedin = false;
      this.isAdmin = false;

      $http.get('/api/logout').success(function(data) {
        localStorage.removeItem('JWT');
        $rootScope.$emit('logout');
      });
    };

    MeanUserKlass.prototype.checkLoggedin = function() {
     var deferred = $q.defer();

      // Make an AJAX call to check if the user is logged in
      $http.get('/api/loggedin').success(function(user) {
        // Authenticated
        if (user !== '0') $timeout(deferred.resolve);

        // Not Authenticated
        else {
          $cookies.put('redirect', $location.path());
          $timeout(deferred.reject);
          $location.url($meanConfig.loginPage);
        }
      });

      return deferred.promise;
    };

    MeanUserKlass.prototype.checkLoggedOut = function() {
       // Check if the user is not connected
      // Initialize a new promise
      var deferred = $q.defer();

      // Make an AJAX call to check if the user is logged in
      $http.get('/api/loggedin').success(function(user) {
        // Authenticated
        if (user !== '0') {
          $timeout(deferred.reject);
          $location.url('/');
        }
        // Not Authenticated
        else $timeout(deferred.resolve);
      });

      return deferred.promise;
    };

    MeanUserKlass.prototype.checkAdmin = function() {
     var deferred = $q.defer();

      // Make an AJAX call to check if the user is logged in
      $http.get('/api/loggedin').success(function(user) {
        // Authenticated
        if (user !== '0' && user.roles.indexOf('admin') !== -1) $timeout(deferred.resolve);

        // Not Authenticated or not Admin
        else {
          $timeout(deferred.reject);
          $location.url('/');
        }
      });

      return deferred.promise;
    };

    //edit user
    MeanUserKlass.prototype.editUser = function(user,update) {
      var deferred = $q.defer();
      $http.post('/api/users/edit', {user:user,update:update})
          .then(function(res) {
            deferred.resolve(res);
          },function (err) {
            deferred.reject(err);
          });
      return deferred.promise;
    };
    //join class
    MeanUserKlass.prototype.joinClass = function(classId,classCode,unjoin) {
      var deferred = $q.defer();
      classId=classId?classId:'';
      $http.post('/api/user/joinClass/'+classId, {classCode:classCode,unjoin:unjoin})
          .then(function(res) {
            // console.log("joinClass:",res);
            deferred.resolve(res);
          },function (err) {
            deferred.reject(err);
          });
      return deferred.promise;
    };
    // relateChild
    MeanUserKlass.prototype.relateChild = function(childName,childMobile) {
      var deferred = $q.defer();
      $http.get('/api/parents/relateChildren', {params:{name:childName,mobile:childMobile}})
          .then(function(res) {
            deferred.resolve(res);
          },function (err) {
            deferred.reject(err);
          });
      return deferred.promise;
    };

    //check new notification
    MeanUserKlass.prototype.checkNotification = function() {
      var user=this.user;
      var deferred = $q.defer();
      $http.get('/api/user/new_notification')
          .then(function(res) {
            if(res.data.result){
              user.newNotifications = res.data.data;
            }
            deferred.resolve(res);
          },function (err) {
            deferred.reject(err);
          });
      return deferred.promise;
    };
    //readed new notification
    MeanUserKlass.prototype.readedNotification = function() {
      var user=this.user;
      var deferred = $q.defer();
      $http.get('/api/user/readed_notification')
          .then(function(res) {

            user.newNotifications=null;
            deferred.resolve(res);
          },function (err) {
            deferred.reject(err);
          });
      return deferred.promise;
    };
    //edit user
    MeanUserKlass.prototype.myClasses = function() {
      var user=this.user;
      var deferred = $q.defer();
      $http.get('/api/user/myClasses')
          .then(function(res) {
            if(res.data.result){
              user.profile.classes=res.data.data;
            }
            deferred.resolve(res);
          },function (err) {
            deferred.reject(err);
          });
      return deferred.promise;
    };
    return MeanUser;
  }
]);
