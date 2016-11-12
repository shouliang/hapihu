'use strict';

angular.module('mean.classes').controller('AdminClassesController', ['$scope', 'Global', 'System','Common','$uibModal',
	function($scope, Global, System,Common,$uibModal) {
		var vm = this;
		vm.search={status:'all'},vm.schools={list:[],count:'-',page:0,pageItem:20};
		var loadData=vm.loadData=function(page){
			page=page || 1;
			var zone=vm.search.zone || undefined;
			var keyword=vm.search.keyword || undefined;
			System.loadSchools.get({zone:zone,keyword:keyword,page:page,pageItem:vm.schools.pageItem,status:vm.search.status},function(res){
				if(res.result){
					vm.schools={
						list:res.data.list,
						count:res.data.count,
						page:res.data.page,
						pageItem:res.data.pageItem
					}
					var classes=[];

				}

				// console.log("$scope.zones:",$scope.zones);
			});
		}
		loadData();
		vm.searchSchools=function(){
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
		}
		vm.changePage=function (act, page, pageSize, total) {
			loadData(page);
		};
		vm.showClasses=function (grades) {
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: 'school-classes.html',
				resolve: {
					content:function(){
						return grades;
					}
				},
				controller:function ($scope, $uibModalInstance, content) {
					$scope.content=content;
				}
			});
			modalInstance.result.then(function (result) {
			}, function () {

			});
		};
		vm.showTmpClasses=function (grades) {
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: 'school-tmp-classes.html',
				resolve: {
					content:function(){
						return grades;
					}
				},
				controller:function ($scope, $uibModalInstance, content) {
					$scope.content=content;
				}
			});
			modalInstance.result.then(function (result) {
			}, function () {

			});
		};
		vm.goToClass=function () {
			if(!$scope.classId) return;
			$state.go('manage class',{classId:$scope.classId});
		};
	}
])
	.controller('ManageClassController', ['$scope', '$stateParams','Global', 'System','Common','$uibModal','Classes',
		function($scope,$stateParams, Global, System,Common,$uibModal,Classes) {
			var vm = this;
			vm.init = function() {
				if($stateParams.classId) {
					Classes.klass.get({classId:$stateParams.classId}, function (res) {
						$scope.cclass = res.data;
					}, function (err) {
						$scope.toasty.error({
							title: "╮(╯_╰)╭",
							msg: "查询失败"
						});
					});
				}
			};
			vm.updateClass=function (item,action) {
				$scope.sweetAlert.swal({
				  title:'确认此次操作？',
				  text:'',
				  showCancelButton:true,
				  confirmButtonText:'确定',
				  cancelButtonText:'取消'
				},function (isConfirmed) {
				  if(isConfirmed){
					  Classes.klass.update({classId:$stateParams.classId},{action:action,userId:item.userId},function (res) {
						  $scope.toasty.success({
							  title:" ｡◕‿◕｡",
							  msg:"修改成功"
						  });
						  $scope.cclass = res.data;
					  }, function (err) {
						  $scope.toasty.error({
							  title: "╮(╯_╰)╭",
							  msg: "操作失败"
						  });
					  });
				  }
				});

			};
		}
	])
	.controller('EditClassController',function ($scope,$stateParams,Classes) {
		var vm=this;
		vm.init=function () {
			Classes.klass.get({classId:$stateParams.classId},function (res) {
				if(res.result){
					$scope.klass=res.data;
				}else{
					$scope.toasty.error({
						title:"╮(╯_╰)╭",
						msg:"没有找到"
					});
				}

			},function (error) {
				$scope.toasty.error({
					title:"╮(╯_╰)╭",
					msg:"操作失败"
				});
			});
		};
		vm.saveClass=function () {
			if(!$scope.klass.name) return;
			var iklass={
				name:$scope.klass.name,
				status:$scope.klass.status
			}
			Classes.klass.save({classId:$scope.klass._id},iklass,function (res) {
				if(res.result){
					$scope.toasty.success({
						title:" ｡◕‿◕｡",
						msg:"修改成功"
					});
				}
			},function (err) {
				$scope.toasty.error({
					title:"╮(╯_╰)╭",
					msg:"操作失败"
				});
			});
		};
	})
	.controller('AdminAllClassesController',function ($scope,$stateParams,Classes) {
		var vm=this;
		vm.statuses=['confirmed','unconfirmed'];
		$scope.query={status:'unconfirmed'};
		var loadData=$scope.loadData=function (page) {
			$scope.query.page =page || $scope.query.page;
			Classes.klass.get($scope.query,function (res) {
				if(res.result){
					vm.klasses=res.data;
				}else{
					$scope.toasty.error({
						title:"╮(╯_╰)╭",
						msg:"没有找到"
					});
				}

			},function (error) {
				$scope.toasty.error({
					title:"╮(╯_╰)╭",
					msg:"操作失败"
				});
			});
		};
		vm.init=function () {
			loadData();
		};
		vm.selectPage=function (page,$event) {
			$scope.query.page=vm.klasses.page;
			$scope.query.pageItem=vm.klasses && vm.klasses.pageItem ? vm.klasses.pageItem:20;
			loadData();
		};
		vm.confirmClass=function (klass) {
			$scope.sweetAlert.swal({
				title:'确认此次操作？',
				text:'',
				showCancelButton:true,
				confirmButtonText:'确定',
				cancelButtonText:'取消'
			},function (isConfirmed) {
				if(isConfirmed){
					Classes.klass.save({classId:klass._id},{status:'confirmed'},function (res) {
						if(res.result){
							$scope.toasty.success({
								title:" ｡◕‿◕｡",
								msg:"审核成功"
							});
						}
						var index=vm.klasses.list.indexOf(klass);
						vm.klasses.list.splice(index,1);
					},function (err) {
						$scope.toasty.error({
							title:"╮(╯_╰)╭",
							msg:"审核失败"
						});
					});
				}
			});

		};
	})
;
