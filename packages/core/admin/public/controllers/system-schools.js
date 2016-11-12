'use strict';

angular.module('mean.admin').controller('SystemSchoolsController', ['$scope', 'Global', 'System','Common',
	function($scope, Global, System,Common) {
		var vm = this;
		vm.search={},vm.schools={list:[],count:'-',page:0,pageItem:20};
		$scope.submenu.selected='schools';
		vm.loadDefault=function(){
			if(confirm("确定要导入默认数据？"))
			{
				System.initSchools.get({},function(res){
					// console.log('SystemZonesController loadDefault:',res.data);
					$scope.zones=System.formatZones(res.data);
				});
			}
		};
		var loadData=vm.loadData=function(page){
			page=page || 1;
			var zone=vm.search.zone || undefined;
			var keyword=vm.search.keyword || undefined;
			var status=vm.search.status? vm.search.status:'all';
			System.loadSchools.get({zone:zone,keyword:keyword,page:page,pageItem:vm.schools.pageItem,status:vm.search.status},function(res){
				if(res.result){
					vm.schools={
						list:res.data.list,
						count:res.data.count,
						page:res.data.page,
						pageItem:res.data.pageItem
					}
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
		vm.addSchool=function(){
			if(!vm.newSchool){
				return vm.newSchool={
					error:'请输入学校信息'
				}
			}
			if(!vm.newSchool.name){
				return vm.newSchool.error='请输入学校完整名称';
			}
			if(!vm.newSchool.address.province){
				return vm.newSchool.error='请选择所在位置';
			}
			vm.newSchool.zone=[vm.newSchool.address.province.id];
			vm.newSchool.location=[vm.newSchool.address.province.text];
			if(vm.newSchool.address.city){
				vm.newSchool.zone.push(vm.newSchool.address.city.id);
				vm.newSchool.location.push(vm.newSchool.address.city.text);
			}
			if(vm.newSchool.address.district){
				vm.newSchool.zone.push(vm.newSchool.address.district.id);
				vm.newSchool.location.push(vm.newSchool.address.district.text);
			}
			vm.newSchool.error=null;
			vm.tip=null;
			System.addSchool.add({name:vm.newSchool.name,
				postcode:vm.newSchool.zone,
				location:vm.newSchool.location
			},function (res) {
				if(res.status===200){
					vm.tip=res.data;
				}else{
					vm.newSchool.error=res.data;
				}
			},function(err){
				vm.newSchool.error="操作失败，请稍候再试";
			});
		};
		vm.changePage=function (act, page, pageSize, total) {
			loadData(page);
		};
		vm.deleteSchool=function (school) {
			$scope.sweetAlert.swal({
					title: "确定要删除么?",
					// text: "Your will not be able to recover this imaginary file!",
					type: "warning",
					showCancelButton: true,
					confirmButtonColor: "#DD6B55",
					cancelButtonText:"取消",
					confirmButtonText: "确定",
					closeOnConfirm: true},
				function(isConfirm){
					if(!isConfirm) return;
					System.deleteSchool.delete({id:school._id},function(res){
						if(res.status===200){
							$scope.toasty.success(res.data);
							vm.schools.list.splice(vm.schools.list.indexOf(school),1);
							vm.schools.count=vm.schools.count-1;
						}else{
							$scope.toasty.error(res.data);
						}
					},function(err){
						$scope.toasty.error("删除失败");
					});
				});
		};
	}
]);