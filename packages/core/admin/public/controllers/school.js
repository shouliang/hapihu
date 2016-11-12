'use strict';

angular.module('mean.admin').controller('SchoolController', ['$scope','$stateParams','Global', 'System','Common',
    function($scope, $stateParams,Global, System,Common) {

	    var vm = this;
		vm.localGrade=[];
		var loadData=function(){
			var schoolId=$stateParams.id;
			if(!schoolId){
				return vm.errorTip="抱歉，指定学校不存在";
			}
			System.loadSchool.get({id:schoolId,all:true},function (res) {
				if(res.result){
					vm.school=res.data;
					// if(!vm.school.profile) vm.school.profile={};
					vm.initAddress=Common.zoneToAddress({zone:res.data.postcode,location:res.data.location});
					vm.localGrade=res.data.grades;
				}
			});
		};
		loadData();
		vm.editSchool=function () {
			if(!vm.school.name){
				$scope.sweetAlert.swal({
					title:"",
					text:"学校名称不能为空",
					timer:1000,
					showConfirmButton:false
				});
				return;
			}
			var zoneLocation=Common.addressToZone(vm.school.address);
			System.saveSchool.update({schoolId:vm.school._id},{id:vm.school._id,
				name:vm.school.name,
				postcode:zoneLocation.zone,
				location:zoneLocation.location,
				profile:vm.school.profile,
				status:vm.school.status
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
		vm.addGrade=function () {
			if(!vm.newGrade) {
				return $scope.sweetAlert.swal({
					title:'请选择年级',
					text:'',
					timer:1000,
					showConfirmButton:false
				});
			}
			if(checkIfHaveGrade(vm.newGrade)){
				return $scope.sweetAlert.swal({
					title:'年级已经存在',
					timer:1000,
					showConfirmButton:false
				});
			}
			vm.localGrade.push({name:vm.newGrade,classes:[]});
		};
		vm.removeGrade=function (grade) {
			$scope.sweetAlert.swal({
				title:'确定要删除么？',
				text:'',
				showCancelButton:true,
				confirmButtonText:'确定',
				cancelButtonText:'取消'

			},function (isConfirmed) {
				if(isConfirmed){
					vm.localGrade.splice(vm.localGrade.indexOf(grade),1);
				}
			});

		};
		vm.addClass=function (grade) {
			$scope.sweetAlert.swal({
				type:'input',
				title:'添加班级',
				text:'输入班级名称',
				showCancelButton: true,
				closeOnConfirm: true,
				inputPlaceholder:'班级名称',
				showConfirmButton:true,
				animation: "slide-from-top"
			},function (input) {
				if(input){
					grade.classes.push({name:input,classId:null});
				}
			});
		};
		vm.removeClass=function (item,parent) {
			$scope.sweetAlert.swal({
				title:'确定要删除么？',
				text:'',
				showCancelButton:true,
				confirmButtonText:'确定',
				cancelButtonText:'取消'

			},function (isConfirmed) {
				if(isConfirmed){
					parent.classes.splice(parent.classes.indexOf(item),1);
				}
			});

		};
		var checkIfHaveGrade=function (newGrade) {
			var haved=false;
			angular.forEach(vm.localGrade,function (v,k) {
				if(v.name==newGrade){
					haved=true;
				}
			});
			return haved;
		};
		vm.editGrade=function () {
			System.saveSchool.update({schoolId:vm.school._id},{id:vm.school._id,
				name:vm.school.name,
				grades:vm.localGrade
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
    }
]);