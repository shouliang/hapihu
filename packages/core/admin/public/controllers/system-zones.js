'use strict';

angular.module('mean.admin').controller('SystemZonesController', ['$scope', 'Global', 'System',
	function($scope, Global, System) {
		var vm = this;
		$scope.submenu.selected='zones';
		vm.loadDefault=function(){
			if(confirm("确定要导入默认数据？"))
			{
				// console.log("System.initZones:",System.initZones);
				System.initZones.get({},function(res){
					// console.log('SystemZonesController loadDefault:',res.data);
					$scope.zones=System.formatZones(res.data);
				});
			}
		};
		var loadData=vm.loadData=function(){
			System.loadZones.get({},function(res){
				// console.log('SystemZonesController loadData:',data);
				$scope.zones=System.formatZones(res.data);
				// console.log("$scope.zones:",$scope.zones);
			});
		}
		loadData();
		$scope.provinceFilter=function(item){
			return item.level==1;
		};
	}
]);