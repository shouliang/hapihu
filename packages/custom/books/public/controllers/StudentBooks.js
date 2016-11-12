(function () {
  'use strict';
  angular
    .module('mean.books')
    .controller('StudentBooksController', StudentBooksController);
  StudentBooksController.$inject = ['$scope', 'Books'];
  function StudentBooksController($scope, Books) {
    var vm=this;
    $scope.page=1;
    vm.init=function () {
      $scope.books ={};
      loadData();
    };
    var loadData=function (page,pageItem) {
      var page=$scope.books.page || 1;
      var pageItem=$scope.books.pageItem || 5;
      Books.studentBook.get({page:page,pageItem:pageItem},function(res){
        if(res.result){
          $scope.books = res.data;
        }
      },function (res) {
        $scope.toasty.error({
          title:"╮(╯_╰)╭",
          msg:"操作失败"
        });
      })
    };
    vm.selectPage=function (page,$event) {
      var pageItem=($scope.books && $scope.books.pageItem)?$scope.books.pageItem:5;
      loadData($scope.books.page,pageItem);
    };
  }


})();

angular.module('mean.books')
    .controller('StudentBookstoreController',function ($scope,Books,MeanUser,System) {
      var vm=this;
      $scope.user=MeanUser.user;
      vm.init=function () {
        var grade=MeanUser.user.profile.grade;
        $scope.search={};
        if(grade){
          $scope.search.grade=grade;
        }else{
          return;
        }
        System.adminVariables.get({key:'subjects'},function (res) {
          var list=res.data.list;
          angular.forEach(list,function (item) {
            if(item.key==='subjects'){
              vm.subjects=angular.fromJson(item.value);
            }
          });
        },function () {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"无法获取学科数据"
          });
        });
        loadData();
        // Books.books.get($scope.search,function (res) {
        //   if(res.result){
        //     $scope.books=res.data;
        //     var grades=[];
        //     var subjects=[];
        //     angular.forEach($scope.books.list,function (item) {
        //       if(item.grade){
        //         if(grades.indexOf(item.grade)===-1){
        //           grades.push(item.grade);
        //         }
        //       }
        //       if(item.subject){
        //         if(subjects.indexOf(item.subject)===-1){
        //           subjects.push(item.subject);
        //         }
        //       }
        //     });
        //     $scope.books.grades=grades;
        //     $scope.books.subjects=subjects;
        //   }
        // },function (res) {
        //   $scope.toasty.error({
        //     title:"╮(╯_╰)╭",
        //     msg:"加载失败"
        //   });
        // });
        // $scope.myFilter=function (item) {
        //   if(!$scope.search.grade && !$scope.search.subject) return true;
        //   if($scope.search.grade && $scope.search.subject){
        //     return item.grade === $scope.search.grade &&  item.subject === $scope.search.subject;
        //   }else if($scope.search.grade){
        //     return item.grade === $scope.search.grade;
        //   }else{
        //     return item.subject === $scope.search.subject;
        //   }
        // };
      };
      var loadData=$scope.loadData=function (page ,pageItem) {
        page=page || 1;
        pageItem=pageItem || 20;
        $scope.search.page=page;
        $scope.search.pageItem=pageItem;
        Books.books.get($scope.search,function (res) {
          vm.books=res.data;
        },function (err) {
        })
      };
      vm.selectPage=function (page,$event) {
        var pageItem=(vm.books && vm.books.pageItem)?vm.books.pageItem:20;
        loadData(vm.books.page,pageItem);
      };
    })
    .controller('StudentBookController',function ($scope,$state,$stateParams,$timeout,Books,$location,MeanUser,$window,$uibModal,FileUploader) {
      var vm=this;
      vm.selectedNode={};
      vm.init=function () {
        if(!$stateParams.bookId) return;
        Books.studentBook.get({bookId:$stateParams.bookId,bookType:$stateParams.bookType},function (res) {
          if(res.result){
            vm.book=res.data.book;
            vm.selectedBook=vm.book._id;
            if($stateParams.path!==null){
              vm.initSelected($stateParams.path);
            }
          }
        },function (res) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"获取数据失败"
          });
        })

      };
      vm.selectedBook=function () {
        if($scope.selectedBook && $scope.selectedBook!=vm.book._id){
          $state.go("teacher book",{bookId:$scope.selectedBook});
        }
      };
      $scope.selectNode=function (scope) {
        vm.selectedNode.node=scope.$modelValue;
        var nodePath=[],parents=[];
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
        $scope.selectedNode=vm.selectedNode;
        loadData();
        //update url
        var path=nodePath.join(',');
        $state.go('.',{path:path},{location: 'replace', notify: false});
      };
      vm.initSelected=function (path) {
        if(path===undefined) return;
        var nodePath=path.split(",");
        if(nodePath.length===0) return;
        var parents=[];
        var node=vm.book;
        for(var i=0;i<nodePath.length;i++){
          if(!node || !node.nodes) break;
          if(i>0){
            node.expanded=true;
            parents.push(node);
          }
          var idx=parseInt(nodePath[i]);
          node=node.nodes[idx];
        }
        if(node){
          vm.selectedNode.node=node;
          vm.selectedNode.path=nodePath;
          vm.selectedNode.parents=parents;
          $scope.selectedNode=vm.selectedNode;
          loadData();
        }
      };
      var loadData=function () {
        if(vm.selectedNode.node.topics ){
          Books.vendorTopics.search({topicId:"search"},{topicIds:vm.selectedNode.node.topics},function (res) {
            if(res.result){
              $scope.questions=res.data;
              $scope.selectedAllQ=true;
            }
          },function (err) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"获取数据失败"
            });
          });
        }
      };
      vm.selectAllQ=function () {
        $scope.selectedAllQ=!$scope.selectedAllQ;
        if($scope.questions && $scope.questions.list){
          angular.forEach($scope.questions.list,function (item) {
            item.selected=$scope.selectedAllQ;
          });
        }
      };
      var submitAnswer=function (question) {
        Books.answerTopic.save({topicId:question._id},{myAnswer:question.iAnswer,myAnswerImg:question.iAnswerImg,bookId:vm.book._id},function (res) {
          //console.log("answer success:",res);
          if(res.result){
            var data=res.data;
            question.done=true;
            question.answer=data.answer;
            question.analysis=data.analysis;
            question.status=data.status;
            question.myAnswer=data.myAnswer;
            // baseStatistics();
          }


        },function (res) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"回答失败"
          });
        });
      };
      $scope.answerIt=function (question) {
        var fileItem;
        for(var i=0 ;i < $scope.uploader.queue.length;i++){
          if(question._id===$scope.uploader.queue[i].questionId){
            fileItem=$scope.uploader.queue[i];
            break;
          }
        }
        if(fileItem){
          fileItem.onSuccess=function (response, status, headers) {
            var myAnswerImg=(response && response.length>0 )?response[0].url:'';
            question.iAnswerImg=myAnswerImg;
            submitAnswer(question);
          };
          $scope.uploader.uploadItem(fileItem);
        }else if(question.iAnswer){
          submitAnswer(question);
        }
      };
      $scope.markQuestion=function (question,mark) {
          if(question.myAnswer && question.myAnswer.status==='已批改') return;
          if(question.myAnswer.mark===mark) return;
          var oMark=question.myAnswer.mark;
          question.myAnswer.mark=mark;
        Books.myAnswer.save({myAnswerId:question.myAnswer._id},{mark:mark},function (res) {
          question.myAnswer=res.data;
          $scope.toasty.success({
            title:" ｡◕‿◕｡",
            msg:"操作成功"
          });
        },function (res) {
            question.myAnswer.mark=oMark;
          return $scope.toasty.success({
            title:"╮(╯_╰)╭",
            msg:"操作失败"
          });
        })
      };
      vm.submitTask=function () {
        if($scope.task.myAnswer) return;
        var complete=true;
        angular.forEach($scope.questions.list,function (question) {
          if(!question.myAnswer && !question.myAnswerImg){
            complete=false;
            question.unAnswer=true;
          }
        });
        if(!complete){
          return $scope.toasty.success({
            title:"╮(╯_╰)╭",
            msg:"还有题目未完成"
          });
        }
        Task.answerTask.save({taskId:$scope.task._id},{},function (res) {
          //console.log("res:",res);
          $scope.toasty.success({
            title:" ｡◕‿◕｡",
            msg:"提交成功"
          });
          $state.go('student taskExe',{taskExeId:res.data._id});
        },function (res) {
          $scope.toasty.success({
            title:"╮(╯_╰)╭",
            msg:"提交失败"
          });
        })
      };
      vm.changeTaskExe=function (att) {
        if(att==='remark'){
          updateTaskExe({remark:$scope.taskExe.remark});
        }else if(att==='comment'){
          if(!$scope.newComment) return;
          var comment={
            userId:MeanUser.user._id,
            username:MeanUser.user.username,
            name:MeanUser.user.name,
            type:MeanUser.user.userType,
            comment:$scope.newComment
          };
          updateTaskExe({comment:comment},function (err,res) {
            if(err){

            }else{
              $scope.taskExe.comments.push(comment);
              $scope.newComment='';
            }
          });
        }
      };
      var updateTaskExe=function (content,callback) {
        Task.taskExe.update({taskExeId:$scope.taskExe._id},content,function (res) {
          $scope.toasty.success({
            title:"╮(╯_╰)╭",
            msg:"保存成功"
          });
          if(callback){
            callback(null,res);
          }
        },function (res) {
          $scope.toasty.success({
            title:"╮(╯_╰)╭",
            msg:"保存失败"
          });
          callback(res);
        });
      };
      $scope.selectImg=function (element) {
        // //console.log(element);
      };

      $scope.uploader=new FileUploader({
        url:'/api/upload',
        headers:{'Authorization':'Bearer '+localStorage.getItem('JWT')},
        queueLimit:50,
        removeAfterUpload:true
      });
      $scope.uploader.filters.push({
        name: 'imageFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
          type=type.toLowerCase();
          return '|jpg|png|jpeg|bmp|gif|tif|'.indexOf(type) !== -1;
        }
      });
      $scope.uploader.onSuccessItem =function (item,res,status,header) {
        $scope.toasty.success({
          title:" ｡◕‿◕｡",
          msg:"上传成功"
        });
      };
      $scope.uploader.onErrorItem =function (item,res,status,header) {
        $scope.toasty.error({
          title:"╮(╯_╰)╭",
          msg:"上传失败"
        });
      };
    })

;