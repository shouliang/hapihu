(function() {
    'use strict';

    function Schedule($stateProvider) {
        $stateProvider.state('schedule example page', {
            url: '/schedule/example',
            templateUrl: 'schedule/views/index.html'
        }).state('schedule circles example', {
            url: '/schedule/example/:circle',
            templateUrl: 'schedule/views/example.html'
        });
    }

    angular
        .module('mean.schedule')
        .config(Schedule);

    Schedule.$inject = ['$stateProvider'];

})();
