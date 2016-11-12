'use strict';

angular.module('mean.common').directive('addClass', function($uibModal,Classes,GRADES) {
    return {
        // can be in-lined or async loaded by xhr
        // or inlined as JS string (using template property)
        restrict:'A',
        replace: false,
        scope:{school:'=toSchool',newClass:'=',onSuccess:'&onSuccess'},
        link: function(scope, element, attrs) {
            element.on('click',function(){
                if(!scope.school){
                    return window.alert('请先选中学校');
                }
                scope.addNew();
            });

            scope.addNew=function () {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/views/addClass.html',
                    windowClass:'theme-modal dialog-md',
                    resolve: {},
                    controller:function ($scope, $uibModalInstance,Common,GRADES) {
                        $scope.GRADES=GRADES;
                        $scope.school=scope.school;
                        $scope.newClass={schoolId:$scope.school._id.toString()};
                        $scope.addClass=function(){
                            if(!$scope.school){
                                return $scope.newClass={
                                    error:'添加班级前请先选择学校'
                                }
                            }
                            
                            $scope.newClass.error=null;
                            $scope.tip=null;
                            $scope.school.classes=$scope.school.classes || [];
                            for(var i=0;i<$scope.school.classes.length;i++){
                                if($scope.school.classes[i].grade==$scope.newClass.grade && $scope.school.classes[i].name == $scope.newClass.name){
                                    return $scope.newClass.error='此班级已经存在，无需再次添加';
                                }
                            }
                            Classes.userClass.add({
                                klass:$scope.newClass
                            },function (res) {
                                if(res.result){
                                    $scope.tip='创建成功';
                                    $uibModalInstance.close(res.data);
                                }else{
                                    $scope.newClass.error='创建失败';
                                }
                            },function(err){
                                if(err.data && typeof (err.data)==='string'){
                                    $scope.newClass.error=err.data;
                                }else{
                                    $scope.newClass.error="操作失败，请稍候再试";
                                }

                            });
                        };
                        $scope.ok=function () {
                            $scope.addClass();
                        }
                        $scope.cancel=function () {
                            $uibModalInstance.dismiss();
                        }

                    }
                }).result.then(function (result) {
                    if(result){
                        scope.newClass=result;
                        //调用方式： on-success="func(newSchool)"
                        if(scope.onSuccess){
                            scope.onSuccess({newClass:result});
                        }
                    }
                });
            };
        }
    };
});
