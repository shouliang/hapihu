(function () {
  'use strict';

  /* jshint -W098 */
  angular
    .module('mean.notification')
    .controller('NotificationController', NotificationController);

  NotificationController.$inject = ['$scope', 'Notification','MeanUser','Parents'];
  function NotificationController($scope,  Notification,MeanUser,Parents) {
    var vm=this;
    vm.user = MeanUser.user;
    $scope.page=1;
    vm.init=function () {
      $scope.notifications={};
      loadData();
    };
    var loadData=function (page,pageItem) {
      var page=$scope.notifications.page || 1;
      var pageItem=$scope.notifications.pageItem || 20;
      if(vm.user.userType!=='teacher'){
        Notification.notification.get({page:page,pageItem:pageItem},function (res) {
          if(res.result){
            $scope.notifications=res.data;
          }
        },function (res) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"操作失败"
          });
        });

      }else if(vm.user.userType==='teacher'){
        Notification.msgTeacherList.get({},function (res) {
          if(res.result){
            $scope.notificationTeacher=res.data;
          }
        },function (res) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"操作失败"
          });
        });
      }
      Parents.parentContact.get({},function (res) {
        if(res.result){
          $scope.contacts=res.data;
        }
      },function (res) {
        $scope.toasty.error({
          title:"╮(╯_╰)╭",
          msg:"操作失败"
        });
      });
    };

    vm.selectPage=function (page,$event) {
      var pageItem=($scope.notifications && $scope.notifications.pageItem)?$scope.notifications.pageItem:20;
      loadData($scope.notifications.page,pageItem);
    };
  }


  angular
      .module('mean.notification')
      .controller('SendMessageController', SendMessageController);

  SendMessageController.$inject = ['$scope', 'Notification','MeanUser','$state'];

  function SendMessageController($scope,  Notification,MeanUser,$state) {
    var vm=this;
    $scope.user = MeanUser.user;
    $scope.userId = MeanUser.user._id;
    $scope.messageFromId = $state.params.messageFromId; //来自谁的，就要发给谁。
    $scope.messageFromName = $state.params.messageFromName;
    $scope.page=1;
    vm.init=function () {
      loadData();
    };
    var loadData = function (page,pageItem) {
      if($state.params.messageFromId){
        // var page = $scope.msgs.page||1;
        // var pageItem = $scope.msgs.pageItem||20;
        Notification.msgList.get({to:$scope.messageFromId,page:page,pageItem:pageItem},function (res) {
          if(res.result){
            $scope.msgs=res.data;
            // for(var i=0;i<$scope.msgs.list.length;i++){
            //   if($scope.userId!==$scope.msgs.list[i].from.userId){
            //     $scope.messageFromId=
            //   }
            // }
          }
        },function (res) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"操作失败"
          });
        });
        Notification.getUserById.get({userId:$scope.messageFromId},function (res) {
          if (res.result){
            $scope.messageFrom = res.data;
          }
        })
      }
    };
    vm.selectPage=function (page,$event) {
      var pageItem=($scope.msgs && $scope.msgs.pageItem)?$scope.msgs.pageItem:20;
      loadData($scope.msgs.page,pageItem);
    };
    $scope.sendMsg = function (content) {
      Notification.sendMsg.update({to:$scope.messageFromId,content:content},function (res) { //来自谁的，就要发给谁。
        if(res.result){
          $scope.toasty.success({
            title: " ｡◕‿◕｡",
            msg: "发送成功"
          });
          vm.init();
          $scope.content='';
        }
      },function () {
        $scope.toasty.error({
          title:"╮(╯_╰)╭",
          msg:"操作失败"
        })
      })
    }
  }

})();