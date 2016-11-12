'use strict';

angular.module('mean.admin').controller('QiujiedaController', function($scope, $stateParams,Global, System,Common,$http,$sce) {
    var vm=this;
    $scope.$sce=$sce;
    $scope.query={};
    $scope.query2={};
    $scope.subjects=['全部','数学','物理','化学','生物','地理'];
    $scope.grades=['全部','小学','初中','高中'];
    $scope.types=['全部','填空','选择','其他'];
    $scope.hards=['全部','非常简单','简单','中等','难','非常难'];
    $scope.loadData=function (type) {
        if(type==='exercises'){
            var params=$scope.query;
            $http({method:'GET',url:'/api/test/qiujieda/exercises',params:params}).then(function (res) {
                if(res.data.result){
                    $scope.exercises=angular.fromJson(res.data.data.original);
                }
            },function (res) {
                console.log("error");
            });
        }else if(type==='papers'){
            var params=$scope.query2;
            $http({method:'GET',url:'/api/test/qiujieda/papers',params:params}).then(function (res) {
                if(res.data.result){
                    $scope.papers=angular.fromJson(res.data.data.original);
                }
            },function (res) {
                console.log("error");
            });
        }
    }
    $scope.loadAnswer=function (exercise) {
        if(!exercise.solution){
            $http({method:'GET',url:'/api/test/qiujieda/exercise',params:{id:exercise.id}}).then(function (res) {
                if(res.data.result){
                    var result=angular.fromJson(res.data.data.original);
                    if(result.message==='ok'){
                        exercise.solution=result.payload.items[0];
                    }

                }
            },function (res) {
                console.log("error");
            });
        }
    }
});