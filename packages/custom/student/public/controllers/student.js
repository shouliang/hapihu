(function () {
  'use strict';
  /* jshint -W098 */
  angular
    .module('mean.student')
    .controller('StudentController', StudentController);
  StudentController.$inject = ['$scope', '$timeout', 'Student','MeanUser','Task','Books'];
  function StudentController($scope, $timeout,Student, MeanUser,Task,Books) {
      var vm=this;
    $scope.test=function () {
      window.history.pushState({},'','hi');
    };
    $scope.user=MeanUser.user;
    if($scope.user.visited && $scope.user.visited.length>1){
      $scope.lastVisited=$scope.user.visited[$scope.user.visited.length-2];
    }
    vm.init=function () {
      //new tasks
      Task.studentTasks.get({page:1,pageItem:3},function (res) {
        if(res.result){
          $scope.tasks=res.data;
            var advices=[
                {
                    min:0,
                    max:60,
                    mark:'较差'
                },
                {
                    min:60,
                    max:70,
                    mark:'一般'
                },
                {
                    min:70,
                    max:85,
                    mark:'良好'
                },
                {
                    min:75,
                    max:101,
                    mark:'很好'
                }
            ];
            for(var i=0;i<$scope.tasks.list.length;i++){
                if($scope.tasks.list[i].done && $scope.tasks.list[i].taskExe.statistics){
                    var rightRate = $scope.tasks.list[i].taskExe.statistics.rightRate;
                    for(var j=0;j<advices.length;j++){
                        if(rightRate>=advices[j].min && rightRate<advices[j].max){
                            $scope.tasks.list[i].advice=advices[j];
                            break;
                        }
                    }
                }
            }
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
      Books.studentBook.get({page:1,pageItem:4}, function(res) {
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
    };
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
    };
    vm.clearNew=function () {
      MeanUser.readedNotification();
    }
  }

    
})();

    angular
        .module('mean.student')
        .controller('collectionNotebookController',collectionNotebookController);
    collectionNotebookController.$inject = ['$scope', '$timeout', 'Student','MeanUser','Task','Books'];
    function collectionNotebookController($scope, $timeout,Student, MeanUser,Task,Books) {
      var  vm = this;
        $scope.user=MeanUser.user;
        $scope.page=1;
        vm.init=function(){
            $scope.questions ={};
            loadData();
        };
        var loadData=function (page,pageItem) {
            var page=$scope.questions.page || 1;
            var pageItem=$scope.questions.pageItem || 20;
            Student.collectionNotebook.get({page:page,pageItem:pageItem},function(res){
                if(res.result){
                    $scope.questions = res.data;
                }
            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"操作失败"
                });
            })
        };
        vm.selectPage=function (page,$event) {
            var pageItem=($scope.questions && $scope.questions.pageItem)?$scope.questions.pageItem:20;
            loadData($scope.questions.page,pageItem);
        };

    }


 
    