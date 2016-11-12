'use strict';

angular.module('mean.theme')
	.controller('ThemeController', function($scope, $state,$window,$location,Global,toasty,SweetAlert,GRADES,ROLES) {
        $scope.$on('$stateChangeSuccess',function () {
            var fullScreen=['home','auth.login','auth.register'];
            if(fullScreen.indexOf($state.current.name)!==-1){
                $scope.fullScreen=true;
            }else{
                $scope.fullScreen=false;
            }
        });
        var version=$location.host();
        version=version.split('.')[0];
        $scope.sysVersion=Global.sysVersion[version] || '';
        $scope.bodyClass=$scope.sysVersion.bodyClass || null;
        $scope.global = Global;
        $scope.package = {
            name: 'theme'
        };
        $scope.toasty=toasty;
        $scope.sweetAlert=SweetAlert;
        $scope.goBack=function () {
          $window.history.back();
        };
        $scope.GRADES=GRADES;
        $scope.ROLES=ROLES;


    }
  );
