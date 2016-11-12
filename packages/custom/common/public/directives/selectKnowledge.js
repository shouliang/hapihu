'use strict';

angular.module('mean.common').directive('selectKnowledge', function($uibModal,Classes,GRADES,KnowledgeSystem) {
    return {
        // can be in-lined or async loaded by xhr
        // or inlined as JS string (using template property)
        restrict:'A',
        replace: false,
        templateUrl:'common/views/selectKnowledge.html',
        scope:{selected:'=knowledgeSelected',onSelect:'&',knowledgeSubject:'=',knowledgeGrade:'@'},
        link: function($scope, element, attrs) {

            $scope.$watch('knowledgeSubject',function () {
                init();
            });
            var loadSystem=function () {
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
            var init=function () {
                $scope.selected={
                    knowledgeSystem:null,
                    // knowledgePoints:knowledgePoints || []
                    knowledgePoints:[]
                };
                $scope.query={
                    subject:$scope.knowledgeSubject?$scope.knowledgeSubject:null
                    // grade:query.grade?query.grade:null
                };
                loadSystem();
            };
            $scope.changeSelect=function () {
              if($scope.onSelect){
                  $scope.onSelect({knowledge:$scope.selected});
              }
            };
            $scope.selectSystem=function (system) {
                $scope.selected.knowledgeSystem=system;
            };
            
        }
    };
});
