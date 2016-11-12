(function () {
  'use strict';

  /* jshint -W098 */
  angular
    .module('mean.classes')
    .controller('ClassesController', ClassesController);

  ClassesController.$inject = ['$scope', 'Classes'];

  function ClassesController($scope, Classes) {

  }
})();
angular.module('mean.classes').controller('JoinClassesController',
    function($scope,$rootScope,$timeout,Classes,MeanUser,System,Common) {
      var vm = this;
      $scope.schools={};
      $scope.user=MeanUser.user;
      vm.init = function() {
        MeanUser.myClasses().then(function (res) {
            $scope.user.profile.classes=$scope.user.profile.classes || [];
        });
        if($scope.user.profile.school){
          vm.search={keyword:$scope.user.profile.school};
          loadData(1);
        }
      };
      var loadData=vm.loadData=function(page,pageItem){
        page=page || 1;
        pageItem=pageItem || 20;
        var zone=vm.search.zone || undefined;
        var keyword=vm.search.keyword || undefined;
        System.loadSchools.get({zone:zone,keyword:keyword,page:page,pageItem:$scope.schools.pageItem},function(res){
            if(res.result){
            $scope.schools={
              list:res.data.list,
              count:res.data.count,
              page:res.data.page,
              pageItem:res.data.pageItem
            }
            if($scope.schools.list.length>0){
              $scope.schoolSelected=$scope.schools.list[0];
            }
          }
        });
      };
        vm.selectPage=function (page,$event) {
            var pageItem=($scope.schools && $scope.schools.pageItem)?$scope.schools.pageItem:20;
            loadData($scope.schools.page,pageItem);
        };
      vm.searchSchools=function(){
        // console.log("vm.search:",vm.search);
        var zone=[];
        if(vm.search.address.province){
          zone.push(vm.search.address.province.id);
        }
        if(vm.search.address.city){
          zone.push(vm.search.address.city.id);
        }
        if(vm.search.address.district){
          zone.push(vm.search.address.district.id);
        }
        vm.search.zone=zone;
        loadData(1);
      };
        vm.selectedSchool=function () {
          $timeout(function () {
              vm.searchSchools();
          },200);
        };
      // $scope.selectSchool=function(){
      //   vm.search.keyword=data.value;
      // };
      // vm.changePage=function (act, page,pageItem, pageSize, total) {
      //   loadData(page,pageItem);
      // };
      vm.inClass=function (klass) {
          var isIn=false;
          angular.forEach($scope.user.profile.classes,function (item) {
              if(item.classId==klass.classId) isIn=true;
          });
          if(isIn){
              $scope.sweetAlert.swal({
                  title:"你已经在此班级",
                  text:'',
                  timer:1500
              });
              return;
          }
        $scope.sweetAlert.swal({
          title:'确认要申请加入此班级？',
          text:'申请后，需要先审核才能进入',
          showCancelButton:true,
          confirmButtonText:'确定',
          cancelButtonText:'取消'

        },function (isConfirmed) {
          if(isConfirmed){
              vm.joinClass(klass.classId);
            // var iclass={name:klass.name,status:"等待确认",classId:klass.classId};
            // $scope.user.profile.classes.push(iclass);
          }
        });
      };
      vm.outClass=function (klass) {
          // $scope.user.profile.classes.splice($scope.user.profile.classes.indexOf(klass),1);
        $scope.sweetAlert.swal({
          title:'确认要退出此班级么？',
          text:'',
          showCancelButton:true,
          confirmButtonText:'确定',
          cancelButtonText:'取消'
        },function (isConfirmed) {
          if(isConfirmed){
              vm.joinClass(klass.classId,null,true);
          }
        });
      };
        vm.joinClass=function (classId,cid,unJoin) {
            if(!classId && !cid) return;
            MeanUser.joinClass(classId,{cid:cid},unJoin).then(function (res) {
                // console.log("joinClass:",res);
                var data=res.data;
                if(data.result){
                    var klass=data.data;
                    if(unJoin){
                        for(var i=0;i<$scope.user.profile.classes.length;i++){
                            if($scope.user.profile.classes[i].classId==classId){
                                $scope.user.profile.classes.splice(i,1);
                                break;
                            }
                        }
                        $scope.toasty.success({
                            title:" ｡◕‿◕｡",
                            msg:"退出成功"
                        });
                    }else{
                        var iclass={name:klass.name,classId:data.data._id,grade:klass.grade,school:klass.school,isNew:true};
                        var members=klass.members;
                        for(var i=0;i<members.length;i++){
                            if(members[i].userId==$scope.user._id.toString()){
                                iclass.status=members[i].status;
                                break;
                            }
                        }

                        $scope.user.profile.classes.push(iclass);
                        $scope.toasty.success({
                            title:" ｡◕‿◕｡",
                            msg:"加入成功"
                        });
                    }

                }
            },function (err) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:err.data
                });
            });
        };
      vm.updateClass=function () {
        var userPart={
          profile:{
            classes:$scope.user.profile.classes
          }
        }
        MeanUser.editUser(userPart,'classes').then(function (res) {
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
        vm.addNewSchool=function (school) {
            vm.search={};
            $scope.schools.list=[school];
            vm.schoolSelected=school;
        }
        vm.addClassSuccess=function (klass) {
            $scope.user.profile.classes=$scope.user.profile.classes || [];
            $scope.user.profile.classes.push({classId:klass._id,name:klass.name,status:'审核成功',grade:klass.grade,school:{name:vm.schoolSelected.name},isNew:true});
            $scope.toasty.success({
                title:" ｡◕‿◕｡",
                msg:"新建班级并加入"
            });
        }
    })
    .controller('MyClassesController',
        function($scope,$rootScope,$stateParams,$location,Classes,MeanUser) {
            var vm=this;
            $scope.user=MeanUser.user;
            // $scope.myClasses=$scope.user.profile.classes || [];
            vm.init=function () {
                MeanUser.myClasses().then(function (res) {
                    $scope.myClasses=$scope.user.profile.classes || [];
                    if($stateParams.classId){
                        for(var i=0;i<$scope.myClasses.length;i++){
                            if($stateParams.classId===$scope.myClasses[i].classId){
                                $scope.active=i;
                                break;
                            }
                        }
                    }
                });

            };
            vm.loadClass=function (klass) {
                // $location.search({classId:klass.classId});
                if(klass.status.indexOf("成功")===-1) return;
                Classes.klass.get({classId:klass.classId},function (res) {
                    if(res.result){
                        klass.members=res.data.members;
                        klass.school=res.data.school;
                        klass.cid=res.data.cid;
                        klass.ccode=res.data.ccode;
                    }
                });
            };
            vm.manageClass=function (item,action,klass) {
                $scope.sweetAlert.swal({
                    title:'确认此次操作？',
                    text:'',
                    showCancelButton:true,
                    confirmButtonText:'确定',
                    cancelButtonText:'取消'
                },function (isConfirmed) {
                    if(isConfirmed){
                        Classes.klass.update({classId:klass.classId},{action:action,userId:item.userId},function (res) {

                            var newKlass=res.data;
                            var newItem;
                            if(newKlass.members){
                                for(var i=0;i<newKlass.members.length;i++){
                                    if(item.userId===newKlass.members[i].userId){
                                        newItem=newKlass.members[i];
                                        break;
                                    }
                                }
                            }
                            if(action==='check_member'){
                                if(item.status===newItem.status){
                                    $scope.toasty.success({
                                        title:" ｡◕‿◕｡",
                                        msg:"你已同意，还需其他人同意"
                                    });
                                }else{
                                    item.status=newItem.status;
                                    $scope.toasty.success({
                                        title:" ｡◕‿◕｡",
                                        msg:"加入成功"
                                    });
                                }
                            }else{
                                if(newItem){
                                    $scope.toasty.success({
                                        title:" ｡◕‿◕｡",
                                        msg:"你已确认，还需要其他人同意"
                                    });
                                }else{
                                    klass.members.splice( klass.members.indexOf(item),1);
                                    $scope.toasty.success({
                                        title:" ｡◕‿◕｡",
                                        msg:"踢出成功"
                                    });
                                }
                            }
                        }, function (err) {
                            $scope.toasty.error({
                                title: "╮(╯_╰)╭",
                                msg: "操作失败"
                            });
                        });
                    }
                });

            };
            vm.joinClass=function (code,klass) {
                if(!code) return;
                MeanUser.joinClass(klass.classId,{ccode:code}).then(function (res) {

                    var data=res.data;
                    if(data.result){
                        klass.members=data.data.members;
                        klass.status='审核成功';
                        klass.school=data.data.school;
                        klass.grade=data.data.grade;
                        $scope.toasty.success({
                            title:" ｡◕‿◕｡",
                            msg:"加入成功"
                        });
                    }
                },function (res) {
                    var msg=res.data;
                    if(typeof (msg) === 'string'){
                        $scope.toasty.error({
                            title: "╮(╯_╰)╭",
                            msg: "验证码错误"
                        });
                    }
                });
            };
        }
    )
;