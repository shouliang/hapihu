(function () {
  'use strict';

  /* jshint -W098 */
  angular
    .module('mean.common')
    .controller('CommonController', CommonController);

  CommonController.$inject = ['$scope', 'Global', 'Common'];

  function CommonController($scope, Global, Common) {
    $scope.global = Global;
    $scope.package = {
      name: 'common'
    };
  }
})();
angular
    .module('mean.common')
    .controller('UploadImageModalInstance', ['$scope','FileUploader',function ($scope,FileUploader) {
      var vm=this;
      $scope.uploadeImgs=[];
      vm.uploader=new FileUploader({
        url:'/api/upload',
        headers:{'Authorization':'Bearer '+localStorage.getItem('JWT')},
        queueLimit:10,
        removeAfterUpload:true
      });
      vm.uploader.filters.push({
        name: 'imageFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
          return '|jpg|png|jpeg|bmp|gif|tiff|'.indexOf(type) !== -1;
        }
      });
      vm.uploader.onCompleteAll=function () {
        $scope.$close($scope.uploadeImgs);
      }
      vm.uploader.onSuccessItem =function (item,res,status,header) {
        $scope.uploadeImgs.push(res[0].url);
      };
      vm.uploader.onErrorItem =function (item,res,status,header) {
        alert("抱歉，上传失败");
      };
    }])
;