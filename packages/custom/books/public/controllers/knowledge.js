/**
 * Created by freya on 2016/8/17 0017.
 */
    'use strict';
    angular.module('mean.books')
        .controller('KnowledgeSystemListController',function ($state,$stateParams,$scope,KnowledgeSystem) {
            var vm=this;
            vm.init=function () {
                $scope.query={};
                KnowledgeSystem.knowledgeSystem.query($scope.query,function (res) {
                    $scope.knowledgeSystems=res.data;
                    if($scope.knowledgeSystems.count===0){
                        $scope.tip='没有找到相关知识体系';
                    }
                },function (err) {
                    scope.tip='数据加载失败';
                });

            };

        })
        .controller('KnowledgeSystemController', function ($scope,$state,$stateParams, KnowledgeSystem,System,Common) {
            var vm=this;
            vm.init=function () {
                vm.loadOrderKnowledge();
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
            };
            vm.loadOrderKnowledge=function () {
                if($stateParams.knowledgeSystemId) {
                    KnowledgeSystem.knowledgeSystem.get({knowledgeSystemId:$stateParams.knowledgeSystemId},function (res) {
                        if(!res){
                            $scope.tip='没有找到相关知识体系';
                        }else {
                            $scope.knowledgeSystem=res;
                        }
                    },function (err) {
                        scope.tip='数据加载失败';
                    });
                };
            };
            vm.loadUnOrderKnowledge=function () {
                if(!$scope.knowledgeSystem || !$scope.knowledgeSystem._id) return;
                $scope.isLoading=true;
                KnowledgeSystem.knowledge.query({systemId:$scope.knowledgeSystem._id},function (res) {
                    $scope.knowledgeSystem.children=res.data.list;
                    $scope.isLoading=false;
                },function (err) {
                    $scope.isLoading=false;
                    scope.tip='数据加载失败';
                });
            };
            var addItem=function (item,parent) {
                var parentLevel=parent.level || 0;
                var ob={
                    title:item,
                    parent:parent._id,
                    level:parentLevel+1,
                    systemId:$scope.knowledgeSystem._id
                };
                if(!parent.children){
                    parent.children=[];
                }
                var index=parent.children.push(ob)-1;
                KnowledgeSystem.knowledge.save(ob,function (res) {
                    if(res){
                        parent.children[index]=res;
                    }
                },function (err) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:item+"添加失败"
                    });
                    parent.children.splice(index,1);
                });

            };
            vm.addNewKnowledge=function () {
                if(!$scope.newKnowledge) return;
                var lineArray=$scope.newKnowledge.split(/\n/);
                
                for(var i=0;i<lineArray.length;i++){
                    addItem(lineArray[i],$scope.knowledgeSystem);
                }
                
                
            };
            $scope.removeItem = function (scope) {
                $scope.sweetAlert.swal({
                        title:'确定要删除么？',
                        text:'',
                        showCancelButton:true,
                        confirmButtonText:'确定',
                        cancelButtonText:'取消'
                    },function (isConfirmed) {
                        if(isConfirmed){
                            var nodeData = scope.$modelValue;
                            KnowledgeSystem.knowledge.delete({knowledgeId:nodeData._id},function (res) {
                                $scope.toasty.success({
                                    title:" ｡◕‿◕｡",
                                    msg:"删除成功"
                                });
                                scope.remove();
                            },function (err) {
                                $scope.toasty.error({
                                    title:"╮(╯_╰)╭",
                                    msg:"删除失败"
                                });
                            });

                        }
                    }

                );

            };

            $scope.toggle = function (scope) {
                scope.toggle();
            };

            $scope.moveLastToTheBeginning = function () {
                var a = $scope.data.pop();
                $scope.data.splice(0, 0, a);
            };

            $scope.newSubItem = function (scope) {
                var nodeData = scope.$modelValue;
                addItem('',nodeData);
            };
            $scope.saveItem=function (scope) {
                var nodeData = scope.$modelValue;
                if(scope.$parentNodeScope){
                    var parentData=scope.$parentNodeScope.$modelValue;
                    nodeData.level=parentData.level+1;
                    nodeData.parent=parentData._id;
                }
                KnowledgeSystem.knowledge.update({knowledgeId:nodeData._id},nodeData,function (res) {
                    $scope.toasty.success({
                        title:" ｡◕‿◕｡",
                        msg:"修改成功"
                    });
                },function (err) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"修改失败"
                    });
                });
            }
            $scope.saveKnowledgeSystem=function () {
                $scope.tipe='';
                if(!$scope.knowledgeSystem.name){
                    return $scope.tipe='名字不能为空';
                }
                if(!$scope.knowledgeSystem.subject){
                    return $scope.tipe='学科不能为空';
                }
                if(!$scope.knowledgeSystem.edition){
                    $scope.knowledgeSystem.edition='通用版';
                }
                KnowledgeSystem.knowledgeSystem.update({knowledgeSystemId:$scope.knowledgeSystem._id},$scope.knowledgeSystem,function (res) {
                    $scope.toasty.success({
                        title:" ｡◕‿◕｡",
                        msg:"修改成功"
                    });
                },function (err) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"修改失败"
                    });
                });
            };
            vm.saveKnowledgeSystem=function () {
              if(!$scope.knowledgeSystem) return;
                KnowledgeSystem.knowledgeSystem.update({knowledgeSystemId:$scope.knowledgeSystem._id},$scope.knowledgeSystem,function (res) {
                    if(res){
                        $scope.toasty.success({
                            title:" ｡◕‿◕｡",
                            msg:"修改成功"
                        });
                        $scope.knowledgeSystem=res;
                    }
                },function (err) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"修改失败"
                    });
                });
            };
            $scope.createKnowledgeSystem=function () {
                $scope.tipe='';
                if(!$scope.knowledgeSystem.name){
                    return $scope.tipe='名字不能为空';
                }
                if(!$scope.knowledgeSystem.subject){
                    return $scope.tipe='学科不能为空';
                }
                if(!$scope.knowledgeSystem.edition){
                    $scope.knowledgeSystem.edition='通用版';
                }
                KnowledgeSystem.knowledgeSystem.save($scope.knowledgeSystem,function (res) {
                    $scope.toasty.success({
                        title:" ｡◕‿◕｡",
                        msg:"添加成功"
                    });
                    $state.go('admin knowledgeSystem',{knowledgeSystemId:res._id});
                },function (err) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"添加失败"
                    });
                });
            };
        })
        .controller('KnowledgeSystemCreateController', function ($scope, Resources,System) {
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
                Resources.resource.query($scope.search,function (res) {
                    vm.resources=res.data;
                },function (err) {
                })
            };
            vm.selectPage=function (page,$event) {
                var pageItem=(vm.resources && vm.resources.pageItem)?vm.resources.pageItem:20;
                loadData(vm.resources.page,pageItem);
            };
        });



