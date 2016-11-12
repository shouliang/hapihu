(function () {
  'use strict';

  /* jshint -W098 */
  angular
    .module('mean.teacher')
    .controller('TeacherController', TeacherController);

  TeacherController.$inject = ['$scope', 'Global', '$timeout','Teacher','MeanUser','Task','Books'];

  function TeacherController($scope, Global, $timeout,Teacher,MeanUser,Task,Books) {
    var vm=this;
    $scope.test=function () {
      window.history.pushState({},'','hi');
    };
    vm.alert=function () {
      $scope.sweetAlert.swal({
        title:'组卷及批改稍后开放',
        text:'敬请期待',
        timer:2000,
        showConfirmButton:false
      });
    };
    $scope.user=MeanUser.user;
    if($scope.user.visited && $scope.user.visited.length>1){
      $scope.lastVisited=$scope.user.visited[$scope.user.visited.length-2];
    }
    vm.init=function () {
      //new tasks
      Task.teacherTasks.get({page:1,pageItem:3},function (res) {
        if(res.result){
          $scope.tasks=res.data;
          if($scope.tasks.list.length===0){
            $scope.hasNoTasks=true;
          }
        }
      },function (res) {
        $scope.toasty.error({
          title:"╮(╯_╰)╭",
          msg:"获取作业失败"
        });
      });
      //my books
      Books.teacherBook.get({}, function(res) {
        if(res.result){
          $scope.books=res.data;
          if($scope.books.list.length===0){
            $scope.hasNoBooks=true;
          }
        }

      },function (err) {
        $scope.toasty.error({
          title:"╮(╯_╰)╭",
          msg:"获取我的书失败"
        });
      });

      //new notificatoin
      vm.checkNotification();
    }

    vm.checkNotification=function () {
      if(vm.notificationLoading) return;
      vm.notificationLoading=true;
      MeanUser.checkNotification().then(function (res) {
        $timeout(function () {
          vm.notificationLoading=false;
        },2000);
      },function () {
        $timeout(function () {
          vm.notificationLoading=false;
        },2000);
        $scope.toasty.error({
          title:"╮(╯_╰)╭",
          msg:"获取新消息失败"
        });
      });
    }
    vm.clearNew=function () {
      MeanUser.readedNotification();
    };
  }
})();