'use strict';

angular.module('mean.common').directive('addKnowledge', function($uibModal,Classes,GRADES) {
    return {
        // can be in-lined or async loaded by xhr
        // or inlined as JS string (using template property)
        restrict:'A',
        replace: false,
        scope:{knowledgePoints:'=',onSuccess:'&onSuccess',knowledgeSubject:'@',knowledgeGrade:'@'},
        link: function(scope, element, attrs) {
            element.on('click',function(){
                scope.addNew();
            });
            scope.addNew=function () {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/views/addKnowledge.html',
                    windowClass:'theme-modal dialog-md',
                    resolve: {
                        query:function () {
                            return {subject:scope.knowledgeSubject,grade:scope.knowledgeGrade};
                        },
                        knowledgePoints:function () {
                            return scope.knowledgePoints;
                        }
                    },
                    controller:function ($scope, $uibModalInstance,KnowledgeSystem,query,knowledgePoints) {
                        var vm=this;
                        $scope.isLoading=false;
                        $scope.selected={
                            knowledgeSystem:null,
                            // knowledgePoints:knowledgePoints || []
                            knowledgePoints:[]
                        };
                        $scope.query={
                            subject:query.subject?query.subject:null
                            // grade:query.grade?query.grade:null
                        };
                        var init=function () {
                            $scope.isLoading=true;
                            KnowledgeSystem.knowledgeSystem.query($scope.query,function (res) {
                                $scope.knowledgeSystems=res.data.list;
                                if(!$scope.knowledgeSystems || $scope.knowledgeSystems.length===0){
                                    $scope.tip='没有找到相关知识体系';
                                }
                                $scope.isLoading=false;
                            },function (err) {
                                $scope.isLoading=false;
                                scope.tip='数据加载失败';
                            });
                        };
                        init();
                        $scope.selectSystem=function (system) {
                            $scope.selected.knowledgeSystem=system;
                            // $scope.isLoading=true;
                            // KnowledgeSystem.knowledge.query({systemId:system._id},function (res) {
                            //     system.children=res.data.list;
                            //     $scope.isLoading=false;
                            // },function (err) {
                            //     $scope.isLoading=false;
                            //     scope.tip='数据加载失败';
                            // });
                        };
                        var checkInSelected=function (item) {
                            for(var i=0;i<$scope.selected.knowledgePoints.length;i++) {
                                if (item._id === $scope.selected.knowledgePoints[i]._id) {
                                    return true;
                                }
                            }
                            return false;
                        };
                        $scope.selectNode=function (scope) {
                            scope.$modelValue.iselected=!scope.$modelValue.iselected;
                            var selecteState=scope.$modelValue.iselected;
                            var nodePath=[],parents=[];
                            var iscope=scope;
                            var live=10;
                            while(iscope && live){
                                live--;
                                nodePath.unshift(iscope.index());
                                iscope=iscope.$parentNodeScope;
                                if(iscope){

                                    parents.unshift(iscope.$modelValue);
                                }
                            }
                            //set parent selected
                            angular.forEach(parents,function (item) {
                                if(item){
                                    if(selecteState && !item.iselected){
                                        item.iselected=true;
                                        updateSelected(item,selecteState);
                                    }
                                }
                            });
                            updateSelected(scope.$modelValue,selecteState);
                        };
                        var updateSelected=function (item,selecteState) {
                            var index=$scope.selected.knowledgePoints.indexOf(item);
                            if(selecteState){
                                if(index===-1 && !checkInSelected(item)){
                                    $scope.selected.knowledgePoints.push(item);
                                }
                            }else{
                                if(index!==-1){
                                    $scope.selected.knowledgePoints.splice(index,1);
                                }
                            }
                        };
                        $scope.unSelected=function (item) {
                            item.iselected=false;
                            var index=$scope.selected.knowledgePoints.indexOf(item);
                            $scope.selected.knowledgePoints.splice(index,1);
                        };
                        $scope.ok=function () {
                            if($scope.selected.knowledgePoints.length===0){
                               return $scope.tip='尚未选择知识点';
                            }
                            $uibModalInstance.close($scope.selected);
                        }
                        $scope.cancel=function () {
                            $uibModalInstance.dismiss();
                        }

                    }
                }).result.then(function (result) {
                    if(result){
                        scope.knowledgePoints=result.knowledgePoints;
                        var kp=[];
                        angular.forEach(result.knowledgePoints,function (item) {
                            if(item.children) delete item.children;
                            kp.push(item);
                        });
                        scope.knowledgePoints=kp;
                        //调用方式： on-success="func(knowledge)"
                        if(scope.onSuccess){
                            scope.onSuccess({knowledge:result});
                        }
                    }
                });
            };
        }
    };
});
