'use strict';

angular.module('mean.common').directive('addSchool', function($uibModal,Classes) {
    return {
        // can be in-lined or async loaded by xhr
        // or inlined as JS string (using template property)
        restrict:'A',
        replace: false,
        scope:{newSchool:'=',onSuccess:'&onSuccess'},
        controller:function () {

        },
        link: function(scope, element, attrs) {
            element.on('click',function(){
                scope.addNew();
            });
            scope.addNew=function () {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/views/addSchool.html',
                    windowClass:'theme-modal dialog-md',
                    resolve: {},
                    controller:function ($scope, $uibModalInstance,Common) {

                        $scope.addSchool=function(){
                            if(!$scope.newSchool){
                                return $scope.newSchool={
                                    error:'请输入学校信息'
                                }
                            }
                            if(!$scope.newSchool.name){
                                return $scope.newSchool.error='请输入学校完整名称';
                            }
                            if(!$scope.newSchool.address.province){
                                return $scope.newSchool.error='请选择所在位置';
                            }
                            $scope.newSchool.zone=[$scope.newSchool.address.province.id];
                            $scope.newSchool.location=[$scope.newSchool.address.province.text];
                            if($scope.newSchool.address.city){
                                $scope.newSchool.zone.push($scope.newSchool.address.city.id);
                                $scope.newSchool.location.push($scope.newSchool.address.city.text);
                            }
                            if($scope.newSchool.address.district){
                                $scope.newSchool.zone.push($scope.newSchool.address.district.id);
                                $scope.newSchool.location.push($scope.newSchool.address.district.text);
                            }
                            $scope.newSchool.error=null;
                            $scope.tip=null;
                            Classes.school.add({name:$scope.newSchool.name,
                                postcode:$scope.newSchool.zone,
                                location:$scope.newSchool.location
                            },function (res) {
                                if(res.result){
                                    $scope.tip='创建成功';
                                    $uibModalInstance.close(res.data);
                                }else{
                                    $scope.newSchool.error='创建失败';
                                }
                            },function(err){
                                if(typeof (err)==='string'){
                                    $scope.newSchool.error=err;
                                }else{
                                    $scope.newSchool.error="操作失败，请稍候再试";
                                }

                            });
                        };
                        $scope.ok=function () {
                            $scope.addSchool();
                        }
                        $scope.cancel=function () {
                            $uibModalInstance.dismiss();
                        }

                    }
                }).result.then(function (result) {
                    if(result){
                        scope.newSchool=result;
                        //调用方式： on-success="func(newSchool)"
                        if(scope.onSuccess){
                            scope.onSuccess({newSchool:result});
                        }
                    }
                });
            };
        }
    };
});
