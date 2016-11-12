/**
 * Created by freya on 2016/8/17 0017.
 */
    'use strict';
    angular.module('mean.books')
        .controller('ResourcesController', function ($scope, Resources,System,MeanUser) {
            var vm=this;
            $scope.search={grade:null,subject:null,status:'发布'};
            // vm.isAdmin=MeanUser.user.userType==='admin'?true:false;
            // if(!vm.isAdmin){
            //     $scope.search.status='发布';
            // }
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
                    vm.resources=res.data;
                },function (err) {
                })
            };
            vm.selectPage=function (page,$event) {
                var pageItem=(vm.resources && vm.resources.pageItem)?vm.resources.pageItem:20;
                loadData(vm.resources.page,pageItem);
            };
            $scope.changeSubject=function () {
                $scope.knowledgeSelected={
                    knowledgeSystem:null,
                    knowledgePoints:[]
                };
                loadData();
            };
            $scope.onSelectKnowledge=function (knowledge) {
                loadData();
            };
        })
        .controller('ResourceSaveController',function ($state,$stateParams,$scope,Resources,FileUploader,System,MeanUser) {
            var vm=this;
            $scope.resource={};
            vm.isAdmin=MeanUser.user.userType==='admin'?true:false;
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
                if($stateParams.resourceId){
                    Resources.vendorResource.get({resourceId:$stateParams.resourceId},function (res) {
                        $scope.resource=res;
                        if($scope.resource.knowledge){
                            var knowledgeTitles='';
                            angular.forEach($scope.resource.knowledge,function (item) {
                                knowledgeTitles+=item.title+' ';
                            });
                            $scope.resource.knowledgeTitles=knowledgeTitles;
                        }
                    },function (err) {

                    });
                }
            };
            $scope.changeKnowledge=function (knowledge) {
                var knowledgeTitles='';
                angular.forEach(knowledge.knowledgePoints,function (item) {
                    knowledgeTitles+=item.title+" ";
                });
                $scope.resource.knowledgeTitles=knowledgeTitles;
            };
            vm.uploader=new FileUploader({
                url:'/api/upload',
                headers:{'Authorization':'Bearer '+localStorage.getItem('JWT')},
                queueLimit:1,
                removeAfterUpload:true
            });
            vm.uploader.filters.push({
                name: 'resourceFilter',
                fn: function(item /*{File|FileLikeObject}*/, options) {
                    var type = item.name.split(".");
                    type=type.length>1?type[type.length-1]:'';
                    type=type.toLowerCase();
                    return '|exe|dll|so|bin|'.indexOf(type) === -1;
                }
            });
            vm.uploader.onSuccessItem =function (item,res,status,header) {
                $scope.toasty.success({
                    title:" ｡◕‿◕｡",
                    msg:"上传成功"
                });
                if(res && res.length>0){
                    var data=res[0];
                    $scope.resource.url=data.url;
                    $scope.resource.size=data.size;
                    $scope.resource.name=data.name;
                    $scope.resource.type=data.type;
                }

            };
            vm.uploader.onErrorItem =function (item,res,status,header) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"上传失败"
                });
            };
            vm.saveResource=function (next) {
                if(!$scope.resource.title){
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"请填写资源标题"
                    });
                    return;
                }
                if(!$scope.resource.url){
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"没有上传资源或者填写资源地址"
                    });
                    return;
                }
                if($scope.resource._id){
                    Resources.vendorResource.update({resourceId:$scope.resource._id},$scope.resource,function (res) {
                        $scope.toasty.success({
                            title:" ｡◕‿◕｡",
                            msg:"修改成功"
                        });
                        history.back();
                    },function (err) {
                        $scope.toasty.error({
                            title:"╮(╯_╰)╭",
                            msg:"修改失败"
                        });
                    });
                }else{
                    Resources.vendorResource.save($scope.resource,function (res) {
                        $scope.toasty.success({
                            title:" ｡◕‿◕｡",
                            msg:"添加成功"
                        });
                        if(next){
                            $scope.resource={};
                        }else{
                            history.back();
                        }


                    },function (err) {
                        var msg="添加失败";
                        if(angular.isString(err.data)) msg=err.data;
                        $scope.toasty.error({
                            title:"╮(╯_╰)╭",
                            msg:msg
                        });
                    });
                }

            };
        });



