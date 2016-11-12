(function() {
    'use strict';

    /* jshint -W098 */

    function ScheduleController($scope, Global, Schedule, $stateParams) {
        $scope.global = Global;
        $scope.package = {
            name: 'schedule'
        };

        $scope.checkCircle = function() {
            Schedule.checkCircle($stateParams.circle).then(function(response) {
                $scope.res = response;
                $scope.resStatus = 'info';
            }, function(error) {
                $scope.res = error;
                $scope.resStatus = 'danger';
            });
        };
    }

    angular
        .module('mean.schedule')
        .controller('ScheduleController', ScheduleController);

    ScheduleController.$inject = ['$scope', 'Global', 'Schedule', '$stateParams'];

})();
