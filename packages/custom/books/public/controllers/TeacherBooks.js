(function () {
  'use strict';
  angular
    .module('mean.books')
    .controller('TeacherBooksController', TeacherBooksController);

  TeacherBooksController.$inject = ['$scope','Global', 'Books'];

  function TeacherBooksController($scope,Global, Books) {
    var vm=this;
    $scope.global = Global;
    vm.query={},vm.editions=[];
    vm.init = function() {
      $scope.books ={};
      loadData();
    };
    var loadData=function (page,pageItem) {
      var page=$scope.books.page || 1;
      var pageItem=$scope.books.pageItem || 20;
      Books.teacherBook.get({page:page,pageItem:pageItem},function(res){
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
      var pageItem=($scope.books && $scope.books.pageItem)?$scope.books.pageItem:20;
      loadData($scope.books.page,pageItem);
    };

  }


})();

angular.module('mean.books')

    .controller('TeacherBookstoreController',function ($scope,Books,System) {
      var vm=this;
      $scope.search={grade:null,subject:null};
      vm.init=function () {
        System.adminVariables.get({key:'grades,subjects'},function (res) {
          var list=res.data.list;
          angular.forEach(list,function (item) {
            if(item.key==='grades'){
              vm.grades=angular.fromJson(item.value);
            }
            if(item.key==='subjects'){
              vm.subjects=angular.fromJson(item.value);
            }
          });
        },function () {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"无法获取学期数据"
          });
        });
        loadData();
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
    .controller('TeacherBookController',function ($scope,$state,$stateParams,$timeout,Books,$location,MeanUser,$window,$uibModal,Resources) {
      var vm=this;
      vm.selectedNode={};
      vm.init=function () {
        Books.teacherBook.get({}, function(res) {
          vm.books=res.data;
          var bookId=$stateParams.bookId;
          if(!bookId){
            bookId=localStorage.getItem('usedBookId');
          }
          if(!bookId && vm.books.list.length > 0){
            bookId=vm.books.list[0]._id;
          }
          if(bookId){
            for(var i=0;i<vm.books.list.length;i++){
              if(bookId == vm.books.list[i]._id){
                vm.book=vm.books.list[i];
                vm.selectedBook=vm.book._id;
                break;
              }
            }
            Books.teacherBook.get({bookId:bookId},function (res) {
              vm.book=res.data;
              if($stateParams.path!==null){
                vm.initSelected($stateParams.path);
              }
            });
            localStorage.setItem('usedBookId',bookId);
          }else{
            $scope.hasNoBook=true;
          }

        },function (err) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"查询失败"
          });
        });

      };
      vm.alert = function (){
        $scope.sweetAlert.swal( {
          title:'在系统中选择资源尚未开放',
          text:'敬请期待',
          timer:2000,
          showConfirmButton:false
        })
      };
      
      var loadResources=function () {
        if($scope.resources.length>0){
          var resourceIds=[];
          angular.forEach($scope.resources,function (item) {
            if(item._id){
              resourceIds.push(item._id);
            }
          });
          $scope.selectedNode.node.resources=resourceIds;
        }
        if(vm.selectedNode.node.resources && vm.selectedNode.node.resources.length>0){
          Resources.vendorResource.query({resourceIds:vm.selectedNode.node.resources},function (res) {
            if(res.result){
              $scope.resources=res.data.list;
            }
          },function (err) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"获取数据失败"
            });
          });
        }else {
          $scope.resources=[];
        }
      };
      vm.changeBook=function () {
        if(vm.selectedBook && vm.selectedBook!=vm.book._id){
          $state.go("teacher book",{bookId:vm.selectedBook});
        }
      };
      vm.updateNode=function (cb) {
        if($scope.resources.length>0){
          var resourceIds=[];
          angular.forEach($scope.resources,function (item) {
            if(item._id){
              resourceIds.push(item._id);
            }
          });
          $scope.selectedNode.node.resources=resourceIds;
        }

        Books.teacherBook.update({bookId:vm.book._id},{path:$scope.selectedNode.path,node:$scope.selectedNode.node},function (success) {
          $scope.toasty.success({
            title:" ｡◕‿◕｡",
            msg:"保存成功"
          });
          if(cb && typeof (cb) == "function"){
            cb(null,'ok');
          }
        },function (err) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"保存失败"
          });
        });
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
        $scope.resources=[];
        loadResources();
      };
      vm.selectAllQ=function () {
        $scope.selectedAllQ=!$scope.selectedAllQ;
        if($scope.questions && $scope.questions.list){
          angular.forEach($scope.questions.list,function (item) {
            item.selected=$scope.selectedAllQ;
          });
        }
      };
      $scope.addAttach=function (resource) {
        $scope.resources.push(resource);
      };
      vm.resourceMoveUp=function (resource) {
        var index=$scope.resources.indexOf(resource);
        if(index){
          $scope.resources.splice(index,1);
          $scope.resources.splice(index-1,0,resource);
        }
      };
      vm.deleteResource=function (resource) {
        $scope.sweetAlert.swal({
              title:'确定要删除么？',
              text:'',
              showCancelButton:true,
              confirmButtonText:'确定',
              cancelButtonText:'取消'
            },function (isConfirmed) {
              if(isConfirmed){
                $scope.resources.splice($scope.resources.indexOf(resource),1);
              }
            }
        );
      };

      vm.saveResource=function (save) {
        if(save){
          vm.updateNode(function (err,result) {
            vm.editResource=false;
          });
        }else {
          loadResources();
          vm.editResource=false;
        }

      };
      vm.publish=function () {
        if(!vm.selectedNode.node) return;
        var questions=[];
        angular.forEach($scope.questions.list,function (item) {
          if(item.selected) questions.push(item._id);
        });
        if(questions.length===0) {
          $scope.sweetAlert.swal({
            title:"请先选中题目",
            text:"",
            timer:2000,
            showConfirmButton:false
          });
          return;
        }
        var content={
          title:vm.selectedNode.node.title,
          aim:vm.selectedNode.node.aim,
          bookId:vm.book._id,
          topics:questions,
          resources:vm.selectedNode.node.resources,
          path:vm.selectedNode.path,
          subject:vm.book.subject
        };
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'books/views/teacher/publish-setting.html',
          controller: 'PublishSettingController',
          windowClass:'theme-modal dialog-md',
          resolve: {
            content:function(){
              return content;
            }
          }
        });
        modalInstance.result.then(function (result) {
          if(result){
            $scope.toasty.success({
              title:" ｡◕‿◕｡",
              msg:"发布作业成功"
            });
          }
        }, function (cancel) {

        });
      };
    })
    .controller('PublishSettingController', function ($scope, $uibModalInstance,MeanUser,Task,content) {
      $scope.task={content:content};
      $scope.task.title=content.title;
      $scope.task.aim=content.aim;
      var tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      $scope.init=function () {
        $scope.task.endDate=tomorrow;
        $scope.task.type='class';
        $scope.task.aim=content.aim;
        $scope.task.from={
          name:MeanUser.user.name,
          userId:MeanUser.user._id
        }
        $scope.myClasses=[];
        MeanUser.myClasses().then(function (res) {
          var myClasses=MeanUser.user.profile.classes || [];
          angular.forEach(myClasses,function (item) {
            if(item.status.indexOf("成功")>-1){
              $scope.myClasses.push({
                name:item.name,
                classId:item.classId,
                grade:item.grade,
                schoolId:item.school?item.school._id:0,
                schoolName:item.school?item.school.name:''
              });
            }
          });

        },function (res) {
          $scope.alert="获取班级失败";
        });

      };
      $scope.dateOptions = {
        dateDisabled: disabled,
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
      };
      function disabled(data) {
        // var date = data.date,
        //     mode = data.mode;
        // return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
      };
      $scope.today = function() {
        $scope.task.endDate = new Date();
      };
      $scope.clear = function() {
        $scope.task.endDate = null;
      };
      $scope.datePopup={opened:false};
      $scope.ok = function () {
        $scope.alert=null;
        if(!$scope.task.title){
          return $scope.alert="作业标题不能为空";
        }
        var selectedClassIds=[];
        angular.forEach($scope.myClasses,function (item) {
          if(item.checked) selectedClassIds.push({
            name:item.name,
            classId:item.classId,
            grade:item.grade,
            schoolId:item.schoolId,
            schoolName:item.schoolName
          });
        });
        if(selectedClassIds.length===0){
          return $scope.alert="请选择班级";
        }
        $scope.task.to=selectedClassIds;
        $scope.task.type="class";
        Task.task.save({},{task:$scope.task},function (res) {
          $uibModalInstance.close($scope.task);
        },function (res) {
          $scope.alert="布置作业失败";
        });

      };
      $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
      };
    })
;