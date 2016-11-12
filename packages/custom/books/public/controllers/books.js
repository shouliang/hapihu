(function () {
  'use strict';

  /* jshint -W098 */
  angular
    .module('mean.books')
    .controller('BooksController', BooksController);

  BooksController.$inject = ['$scope', 'Global', 'Books'];

  function BooksController($scope, Global, Books) {
    $scope.global = Global;
    $scope.package = {
      name: 'books'
    };
  }

  //define mean.resource
})();
angular
    .module('mean.books')
    .controller('BookController',function ($scope,$state,$stateParams,MeanUser,Books,$uibModal) {
      var vm=this;
      vm.init=function () {
        if(!$state.params.bookId) return;
        $scope.hasOrdered=false;
        Books.book.get({bookId:$state.params.bookId}, function(res) {
          if(res.result){
            vm.book=$scope.book=res.data;
          }
        },function (err) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"查询失败"
          });
        });
        Books.orderStatus($state.params.bookId).then(function (res) {
          var result=res.data;
          if(result.data){
            $scope.hasOrdered=true;
          }
        },function (res) {
          
        });
      };
      vm.selectedNode={};
      vm.orderBook=function () {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'orderBookConfirm.html',
          windowClass:'theme-modal confirmModal',
          resolve: {
            book: function () {
              return vm.book;
            }
          },
          controller: function ($scope, $uibModalInstance, Books,book) {
            $scope.ok = function () {
              $scope.alert=null;
              if(!book || !$scope.bookCode) return;
              // if(MeanUser.user.userType==='teacher'){
              Books.bookOrder.get({bookId:book._id,bookCode:$scope.bookCode},function (res) {
                if(res.result){
                  $scope.alert="下载成功";
                  $uibModalInstance.close(res.data);
                }
              },function (res) {
                if(res.status===400 && typeof (res.data)==='string'){
                  $scope.alert=res.data;
                }else{
                  $scope.alert="操作失败";
                }

              });
            };
            $scope.cancel = function () {
              $uibModalInstance.dismiss('cancel');
            };
          }
        });

        modalInstance.result.then(function (result) {
          $scope.hasOrdered=true;
          MeanUser.user.profile.books=MeanUser.user.profile.books || [];
          MeanUser.user.profile.books.push(result._id.toString());
        }, function (result) {

        });
      };

    });