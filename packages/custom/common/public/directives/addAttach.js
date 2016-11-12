'use strict';

angular.module('mean.common').directive('addAttach', function($uibModal,Classes,GRADES) {
    return {
        // can be in-lined or async loaded by xhr
        // or inlined as JS string (using template property)
        restrict:'A',
        replace: false,
        scope:{newAttach:'=',onSuccess:'&onSuccess'},
        link: function(scope, element, attrs) {
            element.on('click',function(){
                scope.addNew();
            });

            scope.addNew=function () {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/views/addAttach.html',
                    windowClass:'theme-modal dialog-md',
                    resolve: {},
                    controller:function ($scope, $uibModalInstance,Common,FileUploader,Resources) {
                        $scope.newAttach={};
                        $scope.uploader=new FileUploader({
                            url:'/api/upload',
                            headers:{'Authorization':'Bearer '+localStorage.getItem('JWT')},
                            queueLimit:1,
                            removeAfterUpload:true
                        });
                        $scope.uploader.filters.push({
                            name: 'resourceFilter',
                            fn: function(item /*{File|FileLikeObject}*/, options) {
                                var type = item.name.split(".");
                                type=type.length>1?type[type.length-1]:'';
                                type=type.toLowerCase();
                                return '|exe|dll|so|bin|'.indexOf(type) === -1;
                            }
                        });
                        $scope.uploader.onSuccessItem =function (item,res,status,header) {
                            $scope.tip='上传成功';
                            $scope.newAttach=angular.extend($scope.newAttach,res[0]);
                        };
                        $scope.uploader.onErrorItem =function (item,res,status,header) {
                            $scope.tip='上传失败';
                        };
                        
                        $scope.ok=function () {
                            if(!$scope.newAttach.title){
                               return $scope.tip='请填写标题';
                            }
                            if(!$scope.newAttach.url){
                               return $scope.tip='请填写地址';
                            }
                            $scope.tip='保存中..';
                            Resources.vendorResource.save($scope.newAttach,function (res) {
                                $scope.tip='保存成功';
                                $uibModalInstance.close(res);
                            },function (err) {
                                var mess=err.data;
                                if(!angular.isString(mess) || mess.length>20){
                                    mess=null;
                                }else{
                                    mess=':'+mess;
                                }
                                $scope.tip='保存失败'+mess;
                            });

                        }
                        $scope.cancel=function () {
                            $uibModalInstance.dismiss();
                        }

                    }
                }).result.then(function (result) {
                    if(result){
                        scope.newAttach=result;
                        //调用方式： on-success="func(newAttach)"
                        if(scope.onSuccess){
                            scope.onSuccess({newAttach:result});
                        }
                    }
                });
            };
        }
    };
});
