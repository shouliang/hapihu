'use strict';

angular.module('mean.admin').controller('SystemCompaniesController',['$scope','$state','System',function ($scope,$state,System) {
	var vm=this;
	$scope.submenu.selected='companies';
	vm.companies={list:[]};
	vm.init=function () {
		System.adminCompanies.get({},function (res) {
			vm.companies=res.data;
		});
	};
	$scope.newCompany={};
	vm.saveCompany=function (data,company) {
		if(company._id){
			data._id=company._id;
			System.adminCompanies.update({companyId:company._id},data,function (res) {
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
			if(!data.name){
				return $scope.toasty.error({
					title:"╮(╯_╰)╭",
					msg:"请填写名称"
				});
			}
			System.adminCompanies.save(data,function(res) {
				$scope.toasty.success({
					title:" ｡◕‿◕｡",
					msg:"添加成功"
				});
				company._id=res._id;
			},function (err) {
				$scope.toasty.error({
					title:"╮(╯_╰)╭",
					msg:"添加失败"
				});
			});
			$scope.newCompany={};
		}

	};
	vm.addCompany = function() {
		$scope.newCompany = {
			name: '',
			location: [],
			summary: ''
		};
		vm.companies.list.push($scope.newCompany);

	};
	vm.removeCompany=function (company,index) {
		$scope.sweetAlert.swal({
				title:'确定要删除么？',
				text:'',
				showCancelButton:true,
				confirmButtonText:'确定',
				cancelButtonText:'取消'
			},function (isConfirmed) {
				if(isConfirmed){
					System.adminCompanies.remove({companyId:company._id},function (res) {
						vm.companies.list.splice(index,1);
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