(function () {
  'use strict';

  /* jshint -W098 */
  angular
    .module('mean.books')
    .controller('AdminBooksController', AdminBooksController);

  AdminBooksController.$inject = ['$scope','$state', 'Global', 'Books'];

  function AdminBooksController($scope,$state, Global, Books) {
    var  vm = this;
    $scope.page=1;
    $scope.global = Global;
    vm.query={};
    vm.init = function() {
      $scope.books ={};
      loadData();
    };
    var loadData=function (page,pageItem) {
      var page=$scope.books.page || 1;
      var pageItem=$scope.books.pageItem || 20;
      Books.vendorBooks.get({page:page,pageItem:pageItem},function(res){
        if(res.result){
          $scope.books=res.data;
        }
      },function (res) {
        $scope.toasty.error({
          title:"╮(╯_╰)╭",
          msg:"操作失败"
        });
      })
    };
    vm.selectPage=function (page,$event) {
      var pageItem=($scope.books && $scope.books.pageItem)?$scope.books.pageItem:20;
      loadData($scope.books.page,pageItem);
    };
    vm.create = function(isValid) {
      if (isValid) {
        // $scope.book.permissions.push('test test');
        Books.vendorBooks.save($scope.book,function(response) {
          $scope.toasty.success({
            title:" ｡◕‿◕｡",
            msg:"添加新书成功"
          });
          $state.go('vendor book',{bookId:response._id});
        });

        $scope.book = {};

      } else {
        $scope.submitted = true;
      }
    };
  }


})();

angular.module('mean.books')
    .controller('AdminBookController',['$scope','$state','$stateParams','Books',function ($scope,$state,$stateParams,Books) {
      var vm=this;
      vm.init=function () {
        if($stateParams.bookId){
          Books.vendorBooks.get({bookId:$stateParams.bookId},function (res) {
              vm.book=res;
          },function (error) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"操作失败"
            });
          });
        }
      };
    }])
    .controller('BookEditionsController',['$scope','$state','Books',function ($scope,$state,Books) {
        var vm=this;
        vm.editions={list:[]};
        vm.init=function () {
          Books.adminEditions.get({},function (res) {
            vm.editions=res.data;
          });
        };
      $scope.newEdition={};
      vm.saveEdition=function (data,edition) {
        if(!angular.isArray(data.location)){
          data.location=data.location.split(/[,|\s]+/);
        }
        if(edition._id){
          data._id=edition._id;
          Books.adminEditions.update({editionId:edition._id},data,function (res) {
            $scope.toasty.success({
              title:" ｡◕‿◕｡",
              msg:"添加成功"
            });
          },function (err) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"操作失败"
            });
          });
        }else{
          if(!data.title){
            return $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"请填写名称"
            });
          }
          Books.adminEditions.save(data,function(res) {
            $scope.toasty.success({
              title:" ｡◕‿◕｡",
              msg:"添加成功"
            },function (err) {
              $scope.toasty.error({
                title:"╮(╯_╰)╭",
                msg:"添加失败"
              });
            });
            edition._id=res._id;
          });
          $scope.newEdition={};
        }

      };
      vm.addEdition = function() {
        $scope.newEdition = {
          title: '',
          location: [],
          summary: ''
        };
        vm.editions.list.push($scope.newEdition);

      };
      vm.removeEdition=function (edition,index) {
        $scope.sweetAlert.swal({
              title:'确定要删除么？',
              text:'',
              showCancelButton:true,
              confirmButtonText:'确定',
              cancelButtonText:'取消'
        },function (isConfirmed) {
          if(isConfirmed){
            Books.adminEditions.remove({editionId:edition._id},function (res) {
              vm.editions.list.splice(index,1);
              $scope.toasty.success({
                title:" ｡◕‿◕｡",
                msg:"删除成功"
              });
            },function (error) {
              $scope.toasty.error({
                title:"╮(╯_╰)╭",
                msg:"删除失败"
              });
            });

          }
        }

        );
      }
    }])
;