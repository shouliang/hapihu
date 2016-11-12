'use strict';

angular.module('mean.admin').controller('SystemBaseController',['$scope','$state','System',function ($scope,$state,System) {
	var vm=this;
	$scope.submenu={selected:'base'};
	vm.variables={list:[]};
	vm.init=function () {
		System.adminVariables.get({},function (res) {
			vm.variables=res.data;
		});
	};
	$scope.newVariable={};
	vm.saveVariable=function (data,variable) {

		// if(angular.isString(data.value)){
		// 	data.value=angular.toJson(data.value);
		// }
		if(variable._id){
			data._id=variable._id;
			System.adminVariables.update({varName:variable.key},data,function (res) {
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
			if(!data.key){
				return $scope.toasty.error({
					title:"╮(╯_╰)╭",
					msg:"请填写参数名"
				});
			}
			System.adminVariables.save(data,function(res) {
				$scope.toasty.success({
					title:" ｡◕‿◕｡",
					msg:"添加成功"
				},function (err) {
					$scope.toasty.error({
						title:"╮(╯_╰)╭",
						msg:"添加失败"
					});
				});
				variable.key=res.key;
			});
			$scope.newVariable={};
		}

	};
	vm.addVariable = function() {
		$scope.newVariable = {
			key: '',
			value: '',
			summary: ''
		};
		vm.variables.list.push($scope.newVariable);

	};
	vm.removeVariable=function (variable,index) {
		$scope.sweetAlert.swal({
				title:'确定要删除么？',
				text:'',
				showCancelButton:true,
				confirmButtonText:'确定',
				cancelButtonText:'取消'
			},function (isConfirmed) {
				if(isConfirmed){
					System.adminVariables.remove({varName:variable.key},function (res) {
						vm.variables.list.splice(index,1);
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
}]);