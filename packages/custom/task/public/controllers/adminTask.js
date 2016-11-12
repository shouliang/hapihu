(function () {
  'use strict';

  /* jshint -W098 */
  angular
    .module('mean.books')
    .controller('AdminTaskExeImgController', function ($scope,$state,$http) {
      var vm=this;
      vm.loadUnCompleted=function () {
        $http.get('/api/startRecognizeImg').then(function (res) {
          $scope.toasty.success({
            title:"@!@",
            msg:"执行成功，共"+res.data.data+"条开始执行"
          });
        },function (res) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"操作错误"
          });
        });
      };
    });
})();