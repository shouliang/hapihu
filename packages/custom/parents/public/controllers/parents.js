(function() {
    'use strict';

    /* jshint -W098 */
    angular
        .module('mean.parents')
        .controller('ParentController', ParentController);

    ParentController.$inject = ['$scope', 'Notification', 'Parents', '$stateParams','MeanUser'];
    
    function ParentController($scope, Notification, Parents, $stateParams,MeanUser) {
        $scope.user=MeanUser.user;
        //console.log(MeanUser.user);
        $scope.mychildren = MeanUser.user.profile;
        var vm=this;
        $scope.page=1;
        vm.init=function () {
            $scope.notifications={};
            loadData();
        };
        var loadData=function (page,pageItem) {
            Notification.notification.get({page:page,pageItem:pageItem},function (res) {
                if(res.result){
                    $scope.notifications=res.data;
                }
            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"操作失败"
                });
            });

            Parents.parentContact.get({},function (res) {
                if(res.result){
                    $scope.contacts=res.data;
                }
            },function (res) {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"操作失败"
                });
            });
            
            
        };
    }
    

})();
