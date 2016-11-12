'use strict';
angular.module('mean.organization')
    .controller('OrganizationController', function ($scope,Classes) {
        var vm=this;
        $scope.schools=[];
        vm.init=function () {
            Classes.school.get({mySchool:true},function (res) {
                if(res.result){
                    $scope.schools=res.data.list;
                    $scope.school=$scope.schools[0];
                }
            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"数据加载失败"
                });
            });
        }
        $scope.addNewSchool=function (newSchool) {
            $scope.schools.push(newSchool);
            $scope.school=newSchool;
        };

    })
    .controller('OrganizationSettingController', function ($scope,$stateParams,Organization,System,Common) {
        var vm=this;
        $scope.subMenu='setting';
        $scope.school={_id:$stateParams.schoolId};
        $scope.schools=[];
        vm.init=function () {
            Organization.organization.get({schoolId:$stateParams.schoolId},function (res) {
                if(res.result){
                    $scope.school=res.data;
                    if($scope.school.location){
                        var address={};
                        if($scope.school.location[0]){
                            address.province={text:$scope.school.location[0],id:$scope.school.postcode[0].toString()};
                            if($scope.school.location[1]){
                                address.city={text:$scope.school.location[1],id:$scope.school.postcode[1].toString()};
                                if($scope.school.location[2]){
                                    address.district={text:$scope.school.location[2],id:$scope.school.postcode[2].toString()};
                                }
                            }
                        }
                    }
                    $scope.initAddress=address;
                }
            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"数据加载失败"
                });
            });
        }
        $scope.saveSetting=function () {
            if(!$scope.school.name){
                $scope.sweetAlert.swal({
                    title:"",
                    text:"学校名称不能为空",
                    timer:1000,
                    showConfirmButton:false
                });
                return;
            }
            var zoneLocation=Common.addressToZone($scope.school.address);
            System.saveSchool.update({schoolId:$scope.school._id},{id:$scope.school._id,
                name:$scope.school.name,
                postcode:zoneLocation.zone,
                location:zoneLocation.location,
                profile:$scope.school.profile,
                status:$scope.school.status
            },function (res) {
                if(res.status===200){
                    $scope.toasty.success("更新成功");
                    // $scope.goBack();
                }else{
                    $scope.toasty.error(res.data);
                }
            },function(err){
                $scope.toasty.error("操作失败，请稍候再试");
            });
        };

    })
    .controller('OrganizationProductsController', function ($scope,$stateParams,Classes,System) {
        var vm=this;
        $scope.subMenu='product';
        $scope.school={_id:$stateParams.schoolId};
        vm.init=function () {
            System.loadSchool.get({id:$stateParams.schoolId},function (res) {
                if(res.result){
                    $scope.school=res.data;
                    if(!$scope.school.profile){
                        $scope.school.profile={};
                    }
                    if( !$scope.school.profile.products){
                        $scope.school.profile.products=[];
                    }
                }
            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"数据加载失败"
                });
            })
        };
        vm.addItem = function() {
            $scope.newProduct = {
                name: '',
                desc: ''
            };
            $scope.school.profile.products.push($scope.newProduct);
        };
        vm.removeItem=function (item,index) {
            $scope.sweetAlert.swal({
                    title:'确定要删除么？',
                    text:'',
                    showCancelButton:true,
                    confirmButtonText:'确定',
                    cancelButtonText:'取消'
                },function (isConfirmed) {
                    if(isConfirmed){
                        var list=$scope.school.profile.products;
                        list.splice(list.indexOf(item),1);
                    }
                }

            );
        };
        vm.saveSchool=function () {
            System.saveSchool.update({schoolId:$scope.school._id},{profile:$scope.school.profile},function (res) {
                if(res.result){
                    $scope.toasty.success({
                        title:" ｡◕‿◕｡",
                        msg:"保存成功"
                    });
                }
            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"数据加载失败"
                });
            })
        };
    })
    .controller('OrganizationTrainersController', function ($scope,$stateParams,$uibModal,Organization) {
        var vm=this;
        $scope.subMenu='trainer';
        $scope.school={_id:$stateParams.schoolId};
        vm.init=function () {
            Organization.trainer.get({schoolId:$stateParams.schoolId},function (res) {
                if(res.result){
                    $scope.school=res.data;
                    if(!$scope.school.profile){
                        $scope.school.profile={};
                    }
                    if( !$scope.school.profile.trainers){
                        $scope.school.profile.trainers=[];
                    }
                }
            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"数据加载失败"
                });
            });
        };
        vm.addItem = function() {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'addNewTrainer.html',
                windowClass:'theme-modal dialog-lg',
                resolve: {
                    school: function () {
                        return $scope.school;
                    }
                },
                controller: function ($scope, $uibModalInstance,Users,school) {
                    $scope.newUser = {
                        username: '',
                        name: '',
                        password:'',
                        mobile:'',
                        userType:'trainer',
                        profile:{
                            subject:'',
                            gender:''
                        },
                        roles:['trainer']
                    };
                    $scope.ok = function () {
                        $scope.alert=null;
                        if(!$scope.newUser.username || !$scope.newUser.name || !$scope.newUser.mobile) {
                            $scope.alert='请填写帐号、姓名、手机号';
                            return;
                        }
                        var user = new Users({
                            mobile: $scope.newUser.mobile,
                            name: $scope.newUser.name,
                            username: $scope.newUser.username,
                            password: $scope.newUser.password,
                            confirmPassword: $scope.newUser.password,
                            roles: $scope.newUser.roles,
                            userType:$scope.newUser.userType,
                            profile:$scope.newUser.profile
                        });

                        user.$save(function(data, headers) {
                            $scope.alert='添加成功';
                            $uibModalInstance.close(data);
                        }, function(data, headers) {
                            var error=data.data;
                            if(angular.isArray(error)){
                                error=error[0].msg;
                            }else if(angular.isObject(error)){
                                error=error.msg;
                            }
                            $scope.alert='添加错误：'+error;

                        });
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (result) {
                var user=result;
                Organization.trainer.add({schoolId:$scope.school._id},{trainerId:user._id},function (res) {
                    $scope.toasty.success({
                        title:" ｡◕‿◕｡",
                        msg:"添加成功"
                    });
                    $scope.school.profile.trainers.push(user);
                },function (res) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"添加失败"
                    });
                });

            }, function (result) {
                console.log('数据操作错误');
            });
        };
        vm.deleteItem=function (item,index) {
            $scope.sweetAlert.swal({
                    title:'确定要删除么？',
                    text:'',
                    showCancelButton:true,
                    confirmButtonText:'确定',
                    cancelButtonText:'取消'
                },function (isConfirmed) {
                    if(isConfirmed){
                        Organization.trainer.delete({schoolId:$scope.school._id,trainerId:item._id},function (res) {
                            var list=$scope.school.profile.trainers;
                            list.splice(list.indexOf(item),1);
                            $scope.toasty.success({
                                title:" ｡◕‿◕｡",
                                msg:"删除成功"
                            });
                        },function (res) {
                            $scope.toasty.error({
                                title:"╮(╯_╰)╭",
                                msg:"删除失败"
                            });
                        });

                    }
                }

            );
        };
        vm.saveSchool=function () {
            System.saveSchool.update({schoolId:$scope.school._id},{profile:$scope.school.profile},function (res) {
                if(res.result){
                    $scope.toasty.success({
                        title:" ｡◕‿◕｡",
                        msg:"保存成功"
                    });
                }
            },function (res) {
                console.log('数据操作错误');
            })
        };
    })
    .controller('OrganizationTraineesController', function ($scope,$stateParams,$uibModal,Organization) {
        var vm=this;
        $scope.subMenu='trainee';
        $scope.school={_id:$stateParams.schoolId};
        vm.init=function () {
            Organization.trainee.get({schoolId:$stateParams.schoolId},function (res) {
                if(res.result){
                    $scope.school=res.data;
                    if(!$scope.school.profile){
                        $scope.school.profile={};
                    }
                    if( !$scope.school.profile.trainees){
                        $scope.school.profile.trainees=[];
                    }
                }
            },function (res) {
                console.log("数据加载失败");
            })
        };
        vm.addItem = function() {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'addNewTrainee.html',
                windowClass:'theme-modal dialog-lg',
                resolve: {
                    school: function () {
                        return $scope.school;
                    }
                },
                controller: function ($scope, $uibModalInstance,Users,school) {
                    $scope.newUser = {
                        username: '',
                        name: '',
                        password:'',
                        mobile:'',
                        userType:'trainee',
                        profile:{
                            subject:'',
                            gender:''
                        },
                        roles:['trainee']
                    };
                    $scope.ok = function () {
                        $scope.alert=null;
                        if(!$scope.newUser.username || !$scope.newUser.name || !$scope.newUser.mobile) {
                            $scope.alert='请填写帐号、姓名、手机号';
                            return;
                        }
                        var user = new Users({
                            mobile: $scope.newUser.mobile,
                            name: $scope.newUser.name,
                            username: $scope.newUser.username,
                            password: $scope.newUser.password,
                            confirmPassword: $scope.newUser.password,
                            roles: $scope.newUser.roles,
                            userType:$scope.newUser.userType,
                            profile:$scope.newUser.profile
                        });

                        user.$save(function(data, headers) {
                            $scope.alert='添加成功';
                            console.log("data:",data);
                            $uibModalInstance.close(data);
                        }, function(data, headers) {
                            var error=data.data;
                            if(angular.isArray(error)){
                                error=error[0].msg;
                            }else if(angular.isObject(error)){
                                error=error.msg;
                            }
                            $scope.alert='添加错误：'+error;

                        });
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (result) {
                var user=result;
                Organization.trainee.add({schoolId:$scope.school._id},{traineeId:user._id},function (res) {
                    $scope.toasty.success({
                        title:" ｡◕‿◕｡",
                        msg:"保存成功"
                    });
                    $scope.school.profile.trainees.push({userId:user._id,user:user});
                },function (res) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"添加失败"
                    });
                });

            }, function (result) {
                console.log('数据操作错误');
            });
        };
        vm.deleteItem=function (item,index) {
            $scope.sweetAlert.swal({
                    title:'确定要删除么？',
                    text:'',
                    showCancelButton:true,
                    confirmButtonText:'确定',
                    cancelButtonText:'取消'
                },function (isConfirmed) {
                    if(isConfirmed){
                        Organization.trainee.delete({schoolId:$scope.school._id,traineeId:item.user._id},function (res) {
                            var list=$scope.school.profile.trainees;
                            list.splice(list.indexOf(item),1);
                            $scope.toasty.success({
                                title:" ｡◕‿◕｡",
                                msg:"删除成功"
                            });
                        },function (res) {
                            $scope.toasty.error({
                                title:"╮(╯_╰)╭",
                                msg:"删除失败"
                            });
                        });

                    }
                }
            );
        };
        vm.saveSchool=function () {
            System.saveSchool.update({schoolId:$scope.school._id},{profile:$scope.school.profile},function (res) {
                if(res.result){
                    $scope.toasty.success({
                        title:" ｡◕‿◕｡",
                        msg:"保存成功"
                    });
                }
            },function (res) {
                console.log('数据操作错误');
            })
        };
    })
    .controller('OrganizationTraineeController',function ($scope,$stateParams,Organization) {
        var vm=this;
        $scope.newProduct={};
        $scope.school={_id:$stateParams.schoolId};
        vm.init=function () {
            Organization.trainee.get({schoolId:$stateParams.schoolId,traineeId:$stateParams.userId},function (res) {
                $scope.trainee=res.data.profile.trainees[0];
                if(!$scope.trainee.products){
                    $scope.trainee.products=[];
                }

            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"数据加载失败"
                });
            });
            Organization.trainer.get({schoolId:$stateParams.schoolId},function (res) {
                $scope.school=res.data;
                if($scope.school && $scope.school.profile && $scope.school.profile.products){
                    $scope.products=$scope.school.profile.products;
                }
            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"数据加载失败"
                });
            });
        };
        $scope.changeSubject=function (item) {
            var trainers=[];
            if(!$scope.school.profile || !$scope.school.profile.trainers) return;
            angular.forEach($scope.school.profile.trainers,function (value) {
               if(value && value.profile && value.profile.subject===$scope.newProduct.subject){
                   trainers.push(value);
               }
            });
            $scope.trainers=trainers;
        };
        $scope.changeTrainer=function (item) {
            $scope.newProduct.trainerName=item.name;
            Organization.trainer.get({schoolId:$scope.school._id,trainerId:$scope.newProduct.trainerId},function (res) {
                $scope.classes=res.data.classes;
            },function (res) {
                console.log('获取数据失败');
            });
        };
        $scope.addProduct=function () {
            if(!$scope.newProduct.trainerId || !$scope.newProduct.product) return;
            //check if in class
            if($scope.newProduct.klass && $scope.newProduct.klass._id){
                for(var i=0;i<$scope.trainee.products.length;i++){
                    if($scope.trainee.products[i].classId===$scope.newProduct.klass._id){
                        $scope.toasty.error({
                            title:"╮(╯_╰)╭",
                            msg:"每个班级只能加入一次"
                        });
                        return;
                    }
                }
            }
            var data={
                op:'add',
                traineeId:$scope.trainee.user._id,
                product:{
                    product:$scope.newProduct.product,
                    trainerId:$scope.newProduct.trainerId,
                    trainerName:$scope.newProduct.trainerName,
                    subject:$scope.newProduct.subject,
                    classId:$scope.newProduct.klass?$scope.newProduct.klass._id:'',
                    className:$scope.newProduct.klass?$scope.newProduct.klass.name:'',
                }
            };
            Organization.traineeProducts($scope.school._id,data).then(function (res) {
                $scope.trainee.products.push(data.product);
                $scope.toasty.success({
                    title:" ｡◕‿◕｡",
                    msg:"添加成功"
                });
            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"添加失败"
                });
            });
        };
        $scope.deleteItem=function (item) {
            $scope.sweetAlert.swal({
                    title:'确定要删除么？',
                    text:'',
                    showCancelButton:true,
                    confirmButtonText:'确定',
                    cancelButtonText:'取消'
                },function (isConfirmed) {
                    if(isConfirmed){
                        var data={
                            op:'delete',
                            traineeId:$scope.trainee.userId,
                            product:{
                                product:item.product,
                                trainerId:item.trainerId,
                                subject:item.subject,
                                classId:item.classId
                            }
                        };
                        Organization.traineeProducts($scope.school._id,data).then(function (res) {
                            $scope.trainee.products.splice($scope.trainee.products.indexOf(item),1);
                            $scope.toasty.success({
                                title:" ｡◕‿◕｡",
                                msg:"删除成功"
                            });
                        },function (res) {
                            $scope.toasty.error({
                                title:"╮(╯_╰)╭",
                                msg:"删除失败"
                            });
                        });
                    }
                }
            );
        }
    })
    .controller('OrganizationClassesController', function ($scope,$stateParams,Classes,Organization,$uibModal) {
        var vm=this;
        $scope.subMenu='klass';
        $scope.school={_id:$stateParams.schoolId};
        vm.init=function () {
            Organization.klass.get({schoolId:$stateParams.schoolId},function (res) {
                $scope.school=res.data;
                if($scope.school && $scope.school.classes ){
                    $scope.classes=$scope.school.classes;
                }

            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"数据加载失败"
                });
            });
        };
        $scope.removeItem=function (item) {
            $scope.sweetAlert.swal({
                    title:'确定要删除么？',
                    text:'',
                    showCancelButton:true,
                    confirmButtonText:'确定',
                    cancelButtonText:'取消'
                },function (isConfirmed) {
                    if(isConfirmed){
                        Classes.klass.delete({classId:item.classId},function (res) {
                            var list=$scope.school.classes;
                            list.splice(list.indexOf(item),1);
                        },function (res) {
                            $scope.toasty.error({
                                title:"╮(╯_╰)╭",
                                msg:"删除失败"
                            });
                        });

                    }
                }

            );
        };
        $scope.addNew=function () {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'addNewClass.html',
                windowClass:'theme-modal dialog-md',
                resolve: {
                    school: function () {
                        return $scope.school;
                    }
                },
                controller:function ($scope, $uibModalInstance,Common,GRADES,school) {
                    $scope.GRADES=GRADES;
                    $scope.school=school;
                    $scope.newClass={schoolId:$scope.school._id,status:'open',type:'train'};
                    $scope.addClass=function(){
                        if(!$scope.school){
                            return $scope.newClass={
                                error:'添加班级前请先选择学校'
                            }
                        }
                        $scope.newClass.error=null;
                        $scope.tip=null;
                        $scope.school.classes=$scope.school.classes || [];
                        Classes.userClass.add({
                            klass:$scope.newClass
                        },function (res) {
                            if(res.result){
                                $scope.tip='创建成功';

                                $uibModalInstance.close({
                                    grade:$scope.newClass.grade,
                                    classId:res.data._id,
                                    name:res.data.name,
                                    status:$scope.newClass.status,
                                    subject:$scope.newClass.subject
                                });
                            }else{
                                $scope.newClass.error='创建失败';
                            }
                        },function(err){
                            if(err.data && typeof (err.data)==='string'){
                                $scope.newClass.error=err.data;
                            }else{
                                $scope.newClass.error="操作失败，请稍候再试";
                            }

                        });
                    };
                    $scope.ok=function () {
                        $scope.addClass();
                    }
                    $scope.cancel=function () {
                        $uibModalInstance.dismiss();
                    }

                }
            }).result.then(function (result) {
                if(result){
                    result.status='open';
                    $scope.school.classes.push(result);
                }
            });
        };
    })
    .controller('OrganizationKlassController', function ($scope,$stateParams,Classes,Organization,$uibModal) {
        var vm=this;
        $scope.newMember={};
        $scope.school={_id:$stateParams.schoolId};
        vm.init=function () {
            Organization.klass.get({schoolId:$stateParams.schoolId,classId:$stateParams.classId},function (res) {
                $scope.klass=res.data;
            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"数据加载失败"
                });
            });
            Organization.trainer.get({schoolId:$stateParams.schoolId},function (res) {
                if(res.result){
                    $scope.school=res.data;
                    if(!$scope.school.profile){
                        $scope.school.profile={};
                    }
                    if( !$scope.school.profile.trainers){
                        $scope.school.profile.trainers=[];
                    }
                }
            },function (res) {
                console.log("数据加载失败");
            });
        };
        $scope.selectTrainer=function () {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'selectTrainer.html',
                windowClass:'theme-modal dialog-md',
                resolve: {
                    school: function () {
                        return $scope.school;
                    },
                    currentTrainers:function () {
                        return $scope.klass.managers;
                    },
                },
                controller:function ($scope, $uibModalInstance,school,currentTrainers) {
                    $scope.query={subject:'全部'};
                    var schoolTrainers=[];
                    var filterIds=[];
                    //过滤已经在里面的老师
                    if(currentTrainers){
                        angular.forEach(currentTrainers,function (item) {
                            if(item && item.userId){
                                filterIds.push(item.userId);
                            }
                        });
                    }
                    if(school.profile && school.profile.trainers){
                        angular.forEach(school.profile.trainers,function (item) {
                            if(filterIds.indexOf(item._id)===-1){
                                schoolTrainers.push(item);
                            }
                        });
                    }
                    
                    $scope.trainers=schoolTrainers;
                    $scope.changeSubject=function () {
                        if($scope.query.subject==='全部'){
                            $scope.trainers=schoolTrainers;
                            return;
                        }
                        var trainers=[];
                        angular.forEach(schoolTrainers,function (item) {
                            if(item && item.profile && item.profile.subject===$scope.query.subject){
                                trainers.push(item);
                            }
                        });
                        $scope.trainers=trainers;
                    };
                    $scope.ok=function () {
                        var selectedTrainers=[];
                        angular.forEach($scope.trainers,function (item) {
                            if(item.selected){
                                selectedTrainers.push(item);
                            }
                        });
                        if(selectedTrainers.length>0){
                            $uibModalInstance.close(selectedTrainers);
                        }
                    }
                    $scope.cancel=function () {
                        $uibModalInstance.dismiss();
                    }

                }
            }).result.then(function (result) {
                if(result){
                    //添加到班级
                    var users=[];
                    angular.forEach(result,function (item) {
                        users.push({
                            userId:item._id,
                            username:item.username,
                            name:item.name,
                            userType:'trainer',
                            subject:(item.profile && item.profile.subject) ? item.profile.subject:'',
                            status:"审核成功"
                        });
                    });
                    var data={
                        op:'add',
                        managers:users
                    };
                    Organization.trainerToKlass($scope.klass._id,data).then(function (res) {
                        if(res.data.result){
                            var managers=$scope.klass.managers || [];
                            $scope.klass.managers=managers.concat(users);
                            $scope.toasty.success({
                                title:" ｡◕‿◕｡",
                                msg:"添加成功"
                            });
                        }

                    },function (res) {
                        $scope.toasty.error({
                            title:"╮(╯_╰)╭",
                            msg:"操作失败"
                        });
                    });
                }
            });
        };
        $scope.deleteTrainer=function (item) {
            $scope.sweetAlert.swal({
                    title:'确定要删除么？',
                    text:'',
                    showCancelButton:true,
                    confirmButtonText:'确定',
                    cancelButtonText:'取消'
                },function (isConfirmed) {
                    if(isConfirmed){
                        var data={
                            op:'delete',
                            managerIds:[item.userId]
                        };
                        Organization.trainerToKlass($scope.klass._id,data).then(function (res) {
                            if(res.data.result){
                                $scope.klass.managers.splice($scope.klass.managers.indexOf(item),1);
                                $scope.toasty.success({
                                    title:" ｡◕‿◕｡",
                                    msg:"删除成功"
                                });
                            }
                        },function (res) {
                            $scope.toasty.error({
                                title:"╮(╯_╰)╭",
                                msg:"操作失败"
                            });
                        });
                    }
                }

            );

        };
        $scope.addNewMember=function () {
            if(!$scope.newMember.username) return;
            var data={
                op:'add',
                memberUsernames:[$scope.newMember.username]
            };
            Organization.traineeToKlass($scope.klass._id,data).then(function (res) {
                if(res.data.data.length>0){
                    var newMembers=res.data.data;
                    var members=$scope.klass.members || [];
                    $scope.klass.members=members.concat(newMembers);
                    $scope.toasty.success({
                        title:" ｡◕‿◕｡",
                        msg:"添加成功"
                    });
                }else{
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:'添加学员失败'
                    });
                }

            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:res.data
                });
            })
        };
        $scope.deleteMember=function (item) {
            $scope.sweetAlert.swal({
                    title:'确定要删除么？',
                    text:'',
                    showCancelButton:true,
                    confirmButtonText:'确定',
                    cancelButtonText:'取消'
                },function (isConfirmed) {
                    if(isConfirmed){
                        var data={
                            op:'delete',
                            memberIds:[item.userId]
                        };
                        Organization.traineeToKlass($scope.klass._id,data).then(function (res) {
                            if(res.data.result){
                                $scope.klass.members.splice($scope.klass.members.indexOf(item),1);
                                $scope.toasty.success({
                                    title:" ｡◕‿◕｡",
                                    msg:"删除成功"
                                });
                            }
                        },function (res) {
                            $scope.toasty.error({
                                title:"╮(╯_╰)╭",
                                msg:"操作失败"
                            });
                        });
                    }
                }
            );

        };
    })
    .controller('OrganizationPapersController', function ($scope,$stateParams,Organization) {
        var vm=this;
        $scope.subMenu='paper';
        $scope.school={_id:$stateParams.schoolId};
        vm.init=function () {
            Organization.trainer.get({schoolId:$stateParams.schoolId},function (res) {
                if(res.result){
                    $scope.school=res.data;
                    if(!$scope.school.profile){
                        $scope.school.profile={};
                    }
                    if( !$scope.school.profile.trainers){
                        $scope.school.profile.trainers=[];
                    }
                }
            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"数据加载失败"
                });
            });
        };
    })
;
