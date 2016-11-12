'use strict';

angular.module('mean.admin').controller('UsersController', ['$scope','$state','$stateParams', 'Global', 'Menus', '$rootScope', '$http', 'Users', 'Circles',
    function($scope, $state,$stateParams,Global, Menus, $rootScope, $http, Users, Circles) {
        var vm=this;
        $scope.global = Global;
        $scope.user = {};
        vm.query={};
        if($stateParams){
            vm.query=$stateParams;
        }
        vm.init = function() {
            Users.get(vm.query, function(res) {
                vm.users=res.data;
                // vm.users.list = res.data.list;
            },function (err) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"查询失败"
                });
            });
        };
        vm.searchUsers=function (search) {
            var zone=[];
            if(vm.query.address.province){
                zone.push(vm.query.address.province.id);
            }
            if(vm.query.address.city){
                zone.push(vm.query.address.city.id);
            }
            if(vm.query.address.district){
                zone.push(vm.query.address.district.id);
            }
            vm.query.zone=zone.join(',');
            vm.query.page=undefined;
            $state.go('users',vm.query);
            // Users.query(search,function (users) {
            //     $scope.users = users;
            // });
        };
        vm.changePage=function (act, page, pageSize, total) {
            vm.query.page=page;
            $state.go('users',vm.query);
        };
        $scope.remove = function(user) {
            $scope.sweetAlert.swal({
                title:'确定要删除么？',
                text:'',
                showCancelButton:true,
                confirmButtonText:'确定',
                cancelButtonText:'取消'

            },function (isConfirmed) {
                if(isConfirmed){
                    vm.users.list.splice(vm.users.list.indexOf(user),1);
                    Users.remove({userId:user._id},function (success) {
                        $scope.toasty.success({
                            title:" ｡◕‿◕｡",
                            msg:"已经删除用户"
                        });
                        vm.users.count=vm.users.count-1;
                    },function (error) {
                        $scope.toasty.error({
                            title:"╮(╯_╰)╭",
                            msg:"删除失败"
                        });
                    });
                }
            });
            

            
        };
        $scope.beforeSelect = function(userField, user) {
            if (userField === 'roles') {
                user.tmpRoles = user.roles;
            }
        };
    }
]).controller('UsersUserController',['$scope','$state','$stateParams','$timeout','Users','Common','Circles','System',function ($scope,$state,$stateParams,$timeout,Users,Common,Circles,System) {
    var vm=this;
    vm.originalUser={};
    vm.action=($state.current.name==='users-user')?'update':'add';
    Circles.all(function(acl) {
        var allCircles = [];
        angular.forEach(acl.tree.children,function (v) {
            allCircles.push(v.name);
        });
        $scope.allCircles=allCircles;
    });
    //get companies
    System.adminCompanies.get({},function (res) {
        vm.companies=res.data.list;
    },function (error) {
        
    });
    vm.init = function() {
        if($stateParams.userId){
            Users.get({userId:$stateParams.userId}, function(user) {
                if(user){
                    vm.user=user;
                    vm.originalUser=angular.copy(user);
                    vm.user.profile=vm.user.profile || {};
                    vm.initAddress=vm.user.profile.address?angular.copy(vm.user.profile.address):{};
                }else{
                    $scope.sweetAlert.swal({
                        title:'用户不存在',
                        text:'',
                        timer:1000
                    });
                    $timeout(function () {
                        $scope.goBack();
                    },800);
                }
            });
        }else{
            $scope.sweetAlert.swal({
                title:'没有指定用户',
                text:'',
                timer:1000
            });
        }

    };
    if(vm.action==='update'){
        vm.init();
    }
    vm.search={};
    $scope.getSchoolResults=function(keyword, deferred){
        vm.search.address=vm.user.profile.address;
        Common.getSchoolResults.apply(vm,[keyword, deferred]);
    };

    $scope.selectSchool=function(data){
        vm.user.profile.school=data.value;
    };
    vm.update = function() {
        if(vm.user.profile.address){
            var zoneLocation=Common.addressToZone(vm.user.profile.address);
            vm.user.profile.zone=zoneLocation.zone;
            vm.user.profile.location=zoneLocation.location;
        }else{
            vm.user.profile.zone=[];
            vm.user.profile.location=[];
        }
        if (vm.originalUser.roles.indexOf('admin') !== -1 && vm.user.roles.indexOf('admin') === -1) {
            if (confirm('确定要取消用户admin权限么？')) {
                //$update(params,success,error)
                vm.user.$update(function (success) {
                    $scope.toasty.success({
                                title:" ｡◕‿◕｡",
                                msg:"用户信息修改成功"
                            });
                },function (error) {

                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:error.data
                    });
                });
            } else {
                vm.user.roles = angular.copy(vm.originalUser.roles);
            }
        } else{
            vm.user.$update(function (success) {
                $scope.toasty.success({
                    title:" ｡◕‿◕｡",
                    msg:"用户信息修改成功"
                });
            },function (error) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:error.data.data
                });
            });
        }
    };
    vm.add = function() {
        vm.error=[];
        if(vm.user.profile.address){
            var zoneLocation=Common.addressToZone(vm.user.profile.address);
            vm.user.profile.zone=zoneLocation.zone;
            vm.user.profile.location=zoneLocation.location;
        }
        var user = new Users({
            mobile: vm.user.mobile,
            name: vm.user.name,
            username: vm.user.username,
            password: vm.originalUser.password,
            confirmPassword: vm.originalUser.confirmPassword,
            roles: vm.user.roles,
            userType:vm.user.userType,
            profile:vm.user.profile
        });

        user.$save(function(data, headers) {
            vm.user=data;
            $scope.toasty.success({
                title:" ｡◕‿◕｡",
                msg:"用户信息修改成功"
            });
            vm.action='update';
        }, function(data, headers) {
            var errs=data.data;
            if(angular.isArray(errs)){
                vm.error = errs;
            }else{
                vm.error = [errs];
            }

            $scope.toasty.error({
                title:"╮(╯_╰)╭",
                msg:"操作失败"
            });
        });
    };
}]);
