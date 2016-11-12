'use strict';

angular.module('mean.users')
  .controller('AuthCtrl', ['$scope', '$rootScope', '$http', '$state', 'Global',
    function($scope, $rootScope, $http, $state, Global) {
      // This object will contain list of available social buttons to authorize
      $scope.socialButtonsCounter = 0;
      $scope.$state = $state;

      $http.get('/api/get-config')
        .success(function(config) {
          if(config.hasOwnProperty('local')) delete config.local; // Only non-local passport strategies
          $scope.socialButtons = config;
          $scope.socialButtonsCounter = Object.keys(config).length;
        });
    }
  ])
  .controller('LoginCtrl', ['$scope','$rootScope', 'MeanUser',
    function($scope,$rootScope, MeanUser) {
      $scope.remeberPassword =true;
      var vm = this;
      // This object will be filled by the form
      vm.user = {};
      vm.input = {
        type: 'password',
        placeholder: '密码',
        confirmPlaceholder: '密码确认',
        iconClass: '',
        tooltipText: '显示密码'
      };

      vm.togglePasswordVisible = function() {
        vm.input.type = vm.input.type === 'text' ? 'password' : 'text';
        vm.input.placeholder = vm.input.placeholder === 'Password' ? 'Visible Password' : 'Password';
        vm.input.iconClass = vm.input.iconClass === 'icon_hide_password' ? '' : 'icon_hide_password';
        vm.input.tooltipText = vm.input.tooltipText === 'Show password' ? 'Hide password' : 'Show password';
      };

      $rootScope.$on('loginfailed', function(){
        vm.loginError = MeanUser.loginError;
      });
      // Register the login() function
      vm.login = function() {
        MeanUser.login(this.user);
      };
    }
  ])
  .controller('RegisterCtrl', ['$state','$rootScope','$scope', 'MeanUser','$http','$timeout',
    function($state,$rootScope, $scope,MeanUser,$http,$timeout) {
      var vm = this;
      $scope.mobileConfirm={sendCode:'发送验证码'};
      vm.user = {};
      
      vm.registerForm = MeanUser.registerForm = true;

      vm.input = {
        type: 'password',
        placeholder: '密码',
        placeholderConfirmPass: '密码确认',
        iconClassConfirmPass: '',
        tooltipText: '显示密码',
        tooltipTextConfirmPass: '显示密码'
      };

      vm.togglePasswordVisible = function() {
        vm.input.type = vm.input.type === 'text' ? 'password' : 'text';
        vm.input.placeholder = vm.input.placeholder === '密码' ? '显示密码' : '密码';
        vm.input.iconClass = vm.input.iconClass === 'icon_hide_password' ? '' : 'icon_hide_password';
        vm.input.tooltipText = vm.input.tooltipText === '显示密码' ? '隐藏密码' : '显示密码';
      };
      vm.togglePasswordConfirmVisible = function() {
        vm.input.type = vm.input.type === 'text' ? 'password' : 'text';
        vm.input.placeholderConfirmPass = vm.input.placeholderConfirmPass === '密码确认' ? '显示密码' : '密码确认';
        vm.input.iconClassConfirmPass = vm.input.iconClassConfirmPass === 'icon_hide_password' ? '' : 'icon_hide_password';
        vm.input.tooltipTextConfirmPass = vm.input.tooltipTextConfirmPass === '显示密码' ? '隐藏密码' : '显示密码';
      };

      // Register the register() function
      vm.register = function() {
        MeanUser.register(this.user);
      };
       vm.checkName = function () {
         $http.post('/api/users/checkUserName',{username:vm.user.username}).then(function (res) {
             $scope.isCheckName = true;
             if(res.data.flag==1){
                 $scope.checkName = res.data.msg;
             }else{
                 $scope.isCheckName = false;
             }
         },function(){
             $scope.toasty.error({
                 title:"╮(╯_╰)╭",
                 msg:"操作错误"
             });
         });
       };
      
      $rootScope.$on('registerfailed', function(){
        vm.registerError = MeanUser.registerError;
      });

      // 发送手机验证码
      vm.send_sms = function() {
        if($scope.mobileConfirm.sendCode!=='发送验证码') return;
        $scope.mobileConfirm.sendCode='等待发送';
        if(!vm.user.mobile){
          $scope.mobileConfirm.mobileError=true;
          $scope.mobileConfirm.mobileMsg='请输入手机号码';
          $scope.mobileConfirm.sendCode='发送验证码';
          return ;
        }
        var regx = /^(13|15|17|18|14)[0-9]{9}$/;
        if(!regx.test(vm.user.mobile)){
          $scope.mobileConfirm.mobileError=true;
          $scope.mobileConfirm.mobileMsg='手机号码错误';
          $scope.mobileConfirm.sendCode='发送验证码';
          return ;
        }
        $scope.mobileConfirm.mobileError=false;
        $scope.mobileConfirm.mobileMsg='';
        $scope.mobileConfirm.sendCode='发送中';
        var countDownNum=80;
        var countDown=function () {
          $scope.mobileConfirm.sendCode=countDownNum+'秒后可重发';
          countDownNum--;
          if(countDownNum>0){
            $timeout(countDown,1000);
          }else{
            $scope.mobileConfirm.sendCode='发送验证码';
          }
        }
        $http.post('/api/users/send-sms',{mobile:vm.user.mobile }).then(function(data){
             $scope.mobileConfirm.mobileError=true;
             $scope.mobileConfirm.mobileMsg='验证码已发送，请稍等';
             countDownNum=80;
             countDown();
        },function(res){
          $scope.mobileConfirm.mobileError=true;
          $scope.mobileConfirm.mobileMsg='验证码发送错误，稍等重试';
          $scope.mobileConfirm.sendCode='发送验证码';
        });

      };

      // 发送手机验证码
      vm.check_mobileCode = function() {
        if(!vm.user.mobile_code) return;
        $scope.mobileConfirm.mobileError=false;
        $scope.mobileConfirm.mobileMsg='';
        $http.post('/api/users/check-mobileCode',{mobile:vm.user.mobile,code:vm.user.mobile_code }).then(function(data){
             $scope.mobileConfirm.codeError=true;
             $scope.mobileConfirm.codeMsg='验证成功';
             $scope.mobileConfirm.sendCode='发送验证码';
        },function(res){
          $scope.mobileConfirm.codeError=true;
          $scope.mobileConfirm.codeMsg='验证失败';
        });

      };
    }
  ])
  .controller('UserProfileCtrl',function ($scope,$state,MeanUser,Books) {
    var vm=this;
    vm.user=MeanUser.user;
    $scope.profile = MeanUser.user.profile;
    vm.init=function () {
      loadData();
    };
    var loadData=function (page,pageItem) {
      page=page || 1;
      Books.vendorLatestUpdated.get({page:page,pageItem:pageItem},function (res) {
        vm.records=res.data;
      },function (err) {
        $scope.toasty.error({
          title:"╮(╯_╰)╭",
          msg:"数据加载失败"
        });
      });
    };
    vm.selectPage=function (page,$event) {
      var pageItem=(vm.records && vm.records.pageItem)?vm.records.pageItem:20;
      loadData(vm.records.page,pageItem);
    };
  })
  .controller('ForgotPasswordCtrl', ['$state','MeanUser', '$rootScope','$scope','$http','$timeout',
    function($state,MeanUser, $rootScope, $scope,$http,$timeout) {
      var vm = this;
      vm.user = {};      
      vm.registerForm = MeanUser.registerForm = false;
      $scope.mobileConfirm={sendCode:'发送验证码'};
      // 发送手机验证码
      vm.send_sms = function() {
        if($scope.mobileConfirm.sendCode!=='发送验证码') return;
        $scope.mobileConfirm.sendCode='等待发送';
        if(!vm.user.mobile){
          $scope.mobileConfirm.mobileError=true;
          $scope.mobileConfirm.mobileMsg='请输入手机号码';
          $scope.mobileConfirm.sendCode='发送验证码';
          return ;
        }
        var regx = /^(13|15|17|18|14)[0-9]{9}$/;
        if(!regx.test(vm.user.mobile)){
          $scope.mobileConfirm.mobileError=true;
          $scope.mobileConfirm.mobileMsg='手机号码错误';
          $scope.mobileConfirm.sendCode='发送验证码';
          return ;
        }
        $scope.mobileConfirm.mobileError=false;
        $scope.mobileConfirm.mobileMsg='';
        $scope.mobileConfirm.sendCode='发送中';
        var countDownNum=80;
        var countDown=function () {
          $scope.mobileConfirm.sendCode=countDownNum+'秒后可重发';
          countDownNum--;
          if(countDownNum>0){
            $timeout(countDown,1000);
          }else{
            $scope.mobileConfirm.sendCode='发送验证码';
          }
        }
        $http.post('/api/users/send-sms',{mobile:vm.user.mobile }).then(function(data){
          $scope.mobileConfirm.mobileError=true;
          $scope.mobileConfirm.mobileMsg='验证码已发送，请稍等';
          countDownNum=80;
          countDown();
        },function(res){
          $scope.mobileConfirm.mobileError=true;
          $scope.mobileConfirm.mobileMsg='验证码发送错误，稍等重试';
          $scope.mobileConfirm.sendCode='发送验证码';
        });

      };

      // 发送手机验证码
      vm.check_mobileCode = function() {
        if(!vm.user.mobile_code) return;
        $scope.mobileConfirm.mobileError=false;
        $scope.mobileConfirm.mobileMsg='';
        $http.post('/api/users/check-mobileCode',{mobile:vm.user.mobile,code:vm.user.mobile_code }).then(function(data){
          $scope.mobileConfirm.codeError=true;
          $scope.mobileConfirm.codeMsg='验证成功';
          $scope.mobileConfirm.sendCode='发送验证码';
        },function(res){
          $scope.mobileConfirm.codeError=true;
          $scope.mobileConfirm.codeMsg='验证失败';
        });

      };
      vm.forgotpassword = function() {
        $http.post('/api/forgot-password', {
          username:vm.user.username,
          mobile: vm.user.mobile,
          mobile_code:vm.user.mobile_code
        }).then(function (res) {
          var data=res.data;
          if(data.token){
            $state.go(data.redirect,{tokenId:data.token});
          }
        },function (res) {
          $scope.mobileConfirm.codeError=true;
          $scope.mobileConfirm.codeMsg='验证失败';
        });
      };
      // $rootScope.$on('mobileCodesent', function(event, args){
      //   vm.response = args;
      // });
    }
  ])
    //用户信息
  .controller('UserInfoCtrl',['$state','$scope','$http','$timeout','MeanUser','Common','GRADES','FileUploader','$uibModal',
    function($state,$scope,$http,$timeout,MeanUser,Common,GRADES,FileUploader,$uibModal){
      var vm=this;
      vm.GRADES=GRADES;
      vm.search={},vm.grade={};
      
      vm.user=MeanUser.user;
      $scope.pro = MeanUser.user.profile;
      vm.initAddress=vm.user.profile && vm.user.profile.address ?angular.copy(vm.user.profile.address):null;
      $scope.setSelCity=function(){
      };
      if($.isEmptyObject(vm.user)){
        $state.go('auth.login');
      }
       vm.relateChild = function (childName,childMobile) {
        MeanUser.relateChild(childName,childMobile).then(function (res) {
          var data = res.data;
          if(data.result===1){
            var profile = res.data.data.profile;
              $scope.toasty.success({
                title:" ｡◕‿◕｡",
                msg:"关联成功"
              });
             $scope.pro.children = profile.children;
          }
          if(data.result===0){
            $scope.toasty.error({
              title:'',
              msg:'关联失败或已经关联'
            })
          }
        },function (err) {
          $scope.toasty.error({
            title:'',
            msg:'操作失败'
          })
        });
      };
      
      vm.save=function (op) {
        if(!vm.user.name) return vm.err="请输入用户姓名";
        var zone=[],location=[];
        if(vm.user.profile.address.province){
          zone=[vm.user.profile.address.province.id];
          location=[vm.user.profile.address.province.text];
        }
        if(vm.user.profile.address.city){
          zone.push(vm.user.profile.address.city.id);
          location.push(vm.user.profile.address.city.text);
        }
        if(vm.user.profile.address.district){
          zone.push(vm.user.profile.address.district.id);
          location.push(vm.user.profile.address.district.text);
        }
        if(zone.length===0) return vm.err="请选择地址";
        //relateChild
        if(!$scope.pro.children&&vm.user.userType==='parent')  return vm.err="您必须关联孩子";
        if(vm.user.userType=='student' && !vm.user.profile.grade){
           return vm.err = "必须选择年级";
        }
        vm.user.profile.zone=zone;
        vm.user.profile.location=location;
        //user head
        if($scope.myImage && $scope.newUserHead){
          vm.user.head=$scope.newUserHead;
        }
        vm.err='';
        MeanUser.editUser(vm.user).then(function(){

          vm.tip="修改成功";
          $scope.toasty.success({
            title:" ｡◕‿◕｡",
            msg:"用户信息修改成功"
          });
          if(op==='regist'){
            $state.go('home');
          }else{
            $state.go('user profile');
          }
        },function(err){
          vm.err="抱歉，修改信息失败";
        });
      };
      $scope.getSchoolResults=function(keyword, deferred){
        vm.search.address=vm.user.profile.address;
        Common.getSchoolResults.apply(vm,[keyword, deferred]);
      };

      $scope.selectSchool=function(data){
        vm.user.profile.school=data.value;
      };
    vm.uploader=new FileUploader({
      url:'/api/upload',
      headers:{'Authorization':'Bearer '+localStorage.getItem('JWT')},
      queueLimit:1,
      removeAfterUpload:true
    });
    vm.uploader.filters.push({
      name: 'imageFilter',
      fn: function(item /*{File|FileLikeObject}*/, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|tif|'.indexOf(type) !== -1;
      }
    });
    vm.uploader.onSuccessItem =function (item,res,status,header) {
      $scope.toasty.success({
        title:" ｡◕‿◕｡",
        msg:"上传成功"
      });
      if(res && res.length>0){
        vm.user.profile.certification=res[0].url;
      }
    };
    vm.uploader.onErrorItem =function (item,res,status,header) {
      $scope.toasty.error({
        title:"╮(╯_╰)╭",
        msg:"上传失败"
      });
    };
    //切图
    $scope.myImage='';
    $scope.newUserHead='';
    var handleFileSelect=function(evt) {
      var file=evt.currentTarget.files[0];
      var reader = new FileReader();
      reader.onload = function (evt) {
        $scope.$apply(function($scope){
          $scope.myImage=evt.target.result;
        });
      };
      reader.readAsDataURL(file);
    };
    angular.element(document.querySelector('#head')).on('change',handleFileSelect);
  }])
  .controller('ResetPasswordCtrl', ['$scope','$state','$stateParams','MeanUser','$http', function($scope,$state,$stateParams,MeanUser,$http) {
      var vm = this;
      vm.user = {};
      vm.registerForm = MeanUser.registerForm = false;
      vm.resetpassword = function() {
        $http.post('/api/reset/' + $stateParams.tokenId, {
          password: vm.user.password,
          confirmPassword: vm.user.confirmPassword
        }).then(function (res) {
          $scope.toasty.success({
            title:" ｡◕‿◕｡",
            msg:"设置成功"
          });
          $state.go('auth.login');
        },function (res) {
          var data=res.data;
          if(angular.isDefined(data.msg)){
            data=[data];
          }
          vm.resetErrors=data;
        })
      };
  }
  ])
  .controller('ProfileTeacherResource',
      ['$scope','$state','$stateParams','MeanUser','$http',function () {

        vm.selectAllR=function () {
          $scope.selectedAllR=!$scope.selectedAllR;
          if($scope.resources && $scope.resources.list){
            angular.forEach($scope.resources.list,function (item) {
              item.selected=$scope.selectedAllR;
            });
          }
        };
  }]);
