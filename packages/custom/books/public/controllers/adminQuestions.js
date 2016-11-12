(function () {
  'use strict';

  /* jshint -W098 */
  angular
    .module('mean.books')
    .controller('AdminQuestionsController', function AdminQuestionsController($scope,$state, Books,System,KnowledgeSystem,Papers) {
        var vm=this;
        $scope.query={stage:'2',subjectId:'',system:'知识点',difficult:0};
        vm.selectedNode={};
        $scope.paper=Papers.localPaper();
        vm.init = function() {
          System.adminVariables.get({key:'difficult'},function (res) {
              var list=res.data.list;
              angular.forEach(list,function (item) {
                  if(item.key==='difficult'){
                      $scope.difficults=angular.fromJson(item.value);
                  }
              });
          },function () {
              $scope.toasty.error({
                  title:"╮(╯_╰)╭",
                  msg:"无法获取学期数据"
              });
          });
          vm.loadSubject();
        };

        vm.loadSubject=function () {
            $scope.query.subject={};
            $scope.knowledgeSystem={};
            Papers.subject.get({stage:$scope.query.stage},function (res) {
                var result=res.data;
                if(result && angular.isArray(result)){
                    $scope.subjects=result;
                    $scope.query.subject=$scope.subjects[0];
                    vm.loadKnowledge();
                }
            },function (res) {
                $scope.toasty.error('学科加载失败');
            })
        };
        vm.loadKnowledge=function () {
            if(!$scope.query.subject) return;
            $scope.knowledgeSystem={};
            vm.selectedNode={};
            KnowledgeSystem.knowledgeSystem.get({zxxId:$scope.query.subject.subjectId},function (res) {
                $scope.knowledgeSystem=res.data.list[0];
                // vm.loadData();
            },function (res) {
                $scope.toasty.error('加载失败');
            });
        };
      vm.loadData=function () {
          $scope.questions=null;
          if($scope.query.system){
              //by knowledge
              var questionTypeId=$scope.query.questionTypes?$scope.query.questionTypes.id:null;
              var knowledgePointId1=vm.selectedNode.parents && vm.selectedNode.parents[0]?vm.selectedNode.parents[0].id:null;
              var knowledgePointId2=vm.selectedNode.parents && vm.selectedNode.parents[1]?vm.selectedNode.parents[1].id:null;
              var knowledgePointId3=vm.selectedNode.parents && vm.selectedNode.parents[2]?vm.selectedNode.parents[2].id:null;
              var params={subjectId:$scope.query.subject.subjectId,
                  difficult:$scope.query.difficult,
                  questionTypeId:questionTypeId,
                  knowledgePointId1:knowledgePointId1,
                  knowledgePointId2:knowledgePointId2,
                  knowledgePointId3:knowledgePointId3,
                  startPage:$scope.query.page || 0,
                  countPerPage:$scope.query.pageItem || 20
              };
              console.log("params:",params);
              //test
              Books.adminQuestions.get({},function (res) {
                  $scope.questions=res.data.list;
              },function (res) {
                  console.log("加载失败");
              })
              // Papers.getKnowledgePointQuestionList(params).then(function (res) {
              //     console.log("question res:",res);
              //     if(res.data.result){
              //         $scope.questions=res.data.data;
              //     }
              //
              // },function (res) {
              //     $scope.toasty.error('加载失败');
              // })
          }else{
              //by book
              
          }
      };
      $scope.selectNode=function (scope) {
        vm.selectedNode.node=scope.$modelValue;
        var nodePath=[],parents=[scope.$modelValue];
        var iscope=scope;
        while(iscope){
          nodePath.unshift(iscope.index());
          iscope=iscope.$parentNodeScope;
          if(iscope){
              parents.unshift(iscope.$modelValue);
          }
        }

        vm.selectedNode.path=nodePath;
        vm.selectedNode.parents=parents;
        vm.loadData();
      };
        $scope.addToPaper=function (item) {

            //TODO sync from server

            if($scope.paper.topicIds.indexOf(item._id)===-1){
                if(!$scope.paper.topics[item.type]){
                    $scope.paper.topics[item.type]=[];
                }
                $scope.paper.topics[item.type].push(item);
                $scope.paper.topicIds.push(item._id);
            }
        };
        $scope.removeFromPaper=function (item) {
            var index=$scope.paper.topicIds.indexOf(item._id);
            var topics=$scope.paper.topics[item.type];
            if(topics){
                for(var i=0;i<topics.length;i++){
                    if(topics[i]._id===item._id){
                        topics.splice(i,1);
                        break;
                    }
                }
            }
            $scope.paper.topicIds.splice(index,1);
        };
        $scope.clearTopics=function (qtype) {
          if($scope.paper.topics[qtype]){
              angular.forEach($scope.paper.topics[qtype],function (item) {
                  $scope.paper.topicIds.splice($scope.paper.topicIds.indexOf(item._id),1);
              });
              $scope.paper.topics[qtype]=[];
          }
        };
      vm.changePage=function (act, page, pageSize, total) {
        if(page<Math.ceil(total/pageSize)){
          $scope.query.page=page;
        }
        vm.loadData();
      };


  })
      .controller('PaperPreviewController',function ($scope,Papers) {
          var vm=this;
          $scope.paper=Papers.localPaper();
      });
})();

angular.module('mean.books')
    .controller('AdminQuestionController',['$scope','$state','$stateParams','Books',function ($scope,$state,$stateParams,Books) {
      var vm=this;
      vm.init=function () {
        if($stateParams.bookId){
          Books.vendorBooks.get({bookId:$stateParams.bookId},function (res) {
              vm.book=res;
          },function (error) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"操作失败"
            });
          });
        }
      };
    }])
    .controller('BookEditionsController',['$scope','$state','Books',function ($scope,$state,Books) {
        var vm=this;
        vm.editions={list:[]};
        vm.init=function () {
          Books.adminEditions.get({},function (res) {
            vm.editions=res.data;
          });
        };
      $scope.newEdition={};
      vm.saveEdition=function (data,edition) {
        if(!angular.isArray(data.location)){
          data.location=data.location.split(/[,|\s]+/);
        }
        if(edition._id){
          data._id=edition._id;
          Books.adminEditions.update({editionId:edition._id},data,function (res) {
            $scope.toasty.success({
              title:" ｡◕‿◕｡",
              msg:"添加成功"
            });
          },function (err) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"操作失败"
            });
          });
        }else{
          if(!data.title){
            return $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"请填写名称"
            });
          }
          Books.adminEditions.save(data,function(res) {
            $scope.toasty.success({
              title:" ｡◕‿◕｡",
              msg:"添加成功"
            },function (err) {
              $scope.toasty.error({
                title:"╮(╯_╰)╭",
                msg:"添加失败"
              });
            });
            edition._id=res._id;
          });
          $scope.newEdition={};
        }

      };
      vm.addEdition = function() {
        $scope.newEdition = {
          title: '',
          location: [],
          summary: ''
        };
        vm.editions.list.push($scope.newEdition);

      };
      vm.removeEdition=function (edition,index) {
        $scope.sweetAlert.swal({
              title:'确定要删除么？',
              text:'',
              showCancelButton:true,
              confirmButtonText:'确定',
              cancelButtonText:'取消'
        },function (isConfirmed) {
          if(isConfirmed){
            Books.adminEditions.remove({editionId:edition._id},function (res) {
              vm.editions.list.splice(index,1);
              $scope.toasty.success({
                title:" ｡◕‿◕｡",
                msg:"删除成功"
              });
            },function (error) {
              $scope.toasty.error({
                title:"╮(╯_╰)╭",
                msg:"删除失败"
              });
            });

          }
        }

        );
      }
    }])
;