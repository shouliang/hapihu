
angular.module('mean.books')
    .controller('AdminResourcesController',function ($scope,$state,$stateParams,Resources,System) {
      var vm=this;
      $scope.search={
          grade:$stateParams.grade
          ,subject:$stateParams.subject
          ,status:$stateParams.status
          ,title:$stateParams.title
      };
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
        loadData($stateParams.page,$stateParams.pageItem);
      };
      var loadData=$scope.loadData=function (page ,pageItem) {
        page=page || 1;
        pageItem=pageItem || 20;
        $scope.search.page=page;
        $scope.search.pageItem=pageItem;
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
        Resources.vendorResource.query($scope.search,function (res) {
          vm.resources=res.data;
        },function (err) {
        })
      };
        $scope.changeSearch=function () {
            // loadData(vm.resources.page,pageItem);
            $state.go('admin resources',{page:1,pageItem:vm.resources.pageItem,subject:$scope.search.subject,grade:$scope.search.grade,status:$scope.search.status,title:$scope.search.title});
        };
        vm.selectPage=function () {
            // loadData(vm.resources.page,pageItem);
            $state.go('admin resources',{page:vm.resources.page,pageItem:vm.resources.pageItem,subject:$scope.search.subject,grade:$scope.search.grade,status:$scope.search.status,title:$scope.search.title});
        };
        $scope.onSelectKnowledge=function (knowledge) {
            loadData();
        };
    })
;