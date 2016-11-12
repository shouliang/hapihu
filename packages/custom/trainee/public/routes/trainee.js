(function() {
    'use strict';
    angular
        .module('mean.trainee')
        .config(Trainee);

    Trainee.$inject = ['$stateProvider'];

    function Trainee($stateProvider) {
        $stateProvider.state('trainee', {
            url: '/trainee',
            templateUrl: 'trainee/views/index.html'
        }).state('trainee statistic', {
            url: '/trainee/statistic',
            templateUrl: 'trainee/views/statistic.html'
        }).state('trainee list', {
            url: '/trainee/list',
            templateUrl: 'trainee/views/list.html'
        }).state('trainee task', {
            url: '/trainee/task/:taskId',
            templateUrl: 'trainee/views/task.html'
        }).state('trainee taskExe', {
            url: '/trainee/taskExe/:taskExeId',
            templateUrl: 'trainee/views/taskExe.html'
        });
    }
})();
