'use strict';

angular.module('mean.system').controller('IndexController',function($rootScope,$scope, $state,$timeout,Global,MeanUser,$cookies) {
    var vm=this;
    $scope.global = Global;
    vm.user={};
    $scope.$on('$stateChangeSuccess',function () {
        if(MeanUser && MeanUser.user && MeanUser.user.userType){
          $state.go(MeanUser.user.userType);
        }
    });
    $scope.showVideo=false;
    $scope.$watch('showVideo',function () {
        if(!$scope.videoInstance) return;
         if($scope.showVideo){
             $scope.videoInstance.play();
             $scope.isClose = false;
             $scope.isPlaying=true;
         } else{
             $scope.videoInstance.pause();
             $scope.isPlaying=false;
             $scope.isClose = true;
         }
    });
    $scope.$on('vjsVideoReady', function (e, data) {
        //data contains `id`, `vid`, `player` and `controlBar`
        //NOTE: vid is depricated, use player instead
        // console.log('video id:' + data.id);
        // console.log('video.js player instance:' + data.player);
        $scope.videoInstance=data.player;
        // console.log('video.js controlBar instance:' + data.controlBar);
    });
    vm.login = function() {
        vm.loginError='';
        $cookies.put('redirect','/');
        MeanUser.login(vm.user);
    };
    $rootScope.$on('loginfailed', function(){
        vm.loginError = MeanUser.loginError;
    });
  }
);
