'use strict';

angular.module('mean.common').directive('selectAttach', function($uibModal,Classes,GRADES) {
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
                    templateUrl: 'common/views/selectAttach.html',
                    windowClass:'theme-modal dialog-md',
                    resolve: {},
                    controller:function ($scope, $uibModalInstance,Resources) {
                        Resources.vendorResource.query({},function (res) {
                            
                        });
                        $scope.ok=function () {
                            if(!$scope.newAttach.title){
                               return $scope.tip='请填写标题';
                            }
                            $uibModalInstance.close($scope.selected);
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
