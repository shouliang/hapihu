(function () {
  'use strict';

  /* jshint -W098 */
  angular
    .module('mean.vendor')
    .controller('VendorController', VendorController);

  VendorController.$inject = ['$scope','$timeout','MeanUser', 'Vendor','Books'];

  function VendorController($scope,$timeout,MeanUser, Vendor,Books) {
    var vm=this;
    $scope.user = MeanUser.user;
    vm.init=function () {
      var query={
        page:1,
        pageItem:6,
        sortBy:'-latest'
      }
      Books.vendorBooks.get(query, function(res) {
        vm.books=res.data;
        if(vm.books.count===0){
          vm.hasNoBooks=true;
        }
      },function (err) {
        $scope.toasty.error({
          title:"╮(╯_╰)╭",
          msg:"查询失败"
        });
      });
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
    }
  }
})();