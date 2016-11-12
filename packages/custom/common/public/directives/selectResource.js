'use strict';

angular.module('mean.common').directive('selectResource', function($uibModal,Classes,GRADES,Resources) {
    return {
        // can be in-lined or async loaded by xhr
        // or inlined as JS string (using template property)
        restrict:'A',
        replace: false,
        scope:{selected:'=resourceSelected',onSelect:'&',resourceSubject:'=',resourceGrade:'@'},
        link: function(scope, element, attrs) {

            element.on('click',function(){
                openModal();
            });

            var openModal=function () {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/views/selectResource.html',
                    windowClass:'theme-modal dialog-md',
                    resolve: {
                        query:function () {
                            return {subject:scope.resourceSubject,grade:scope.resourceGrade};
                        }
                    },
                    controller:function ($scope, $uibModalInstance,query) {
                        var vm=this;
                        $scope.selected=[];
                        $scope.query={
                            subject:query.subject?query.subject:null
                            // grade:query.grade?query.grade:null
                        };
                        $scope.search={grade:null,subject:$scope.query.subject,status:'发布'};
                        var loadData=function () {
                            $scope.tip='';
                            if(!$scope.search.title && !($scope.knowledgeSelected && $scope.knowledgeSelected.knowledgePoints.length>0) ){
                                return;
                            }
                            $scope.search.page=1;
                            $scope.search.pageItem=50;
                            //knowledge
                            $scope.search.knowledgeIds=null;
                            if($scope.knowledgeSelected && $scope.knowledgeSelected.knowledgePoints){
                                var knowledgePoints=[];
                                angular.forEach($scope.knowledgeSelected.knowledgePoints,function (item) {
                                    if(item && item._id){
                                        knowledgePoints.push(item._id);
                                    }
                                });
                                if(knowledgePoints.length>0){
                                    $scope.search.knowledgeIds=knowledgePoints.join(',');
                                }
                            }
                            Resources.resource.query($scope.search,function (res) {
                                $scope.resources=res.data;

                            },function (err) {
                                $scope.tip='数据加载失败';
                            })
                        };
                        $scope.searchResource=function () {
                            loadData();
                        };
                        var init=function () {

                        };
                        init();
                        $scope.ok=function () {
                            if($scope.resources && $scope.resources.list){
                                angular.forEach($scope.resources.list,function (item) {
                                    if(item && item.selected){
                                        $scope.selected.push(item);
                                    }
                                });
                            }
                            if($scope.selected.length===0){
                                return $scope.tip='尚未选择资源';
                            }
                            $uibModalInstance.close($scope.selected);
                        }
                        $scope.cancel=function () {
                            $uibModalInstance.dismiss();
                        }

                    }
                }).result.then(function (result) {
                    if(result){
                        scope.selected=result;
                        //调用方式： on-success="func(knowledge)"
                        if(scope.onSelect){
                            scope.onSelect({resources:result});
                        }
                    }
                });
            };
        }
    };
});
