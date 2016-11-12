(function() {
    'use strict';

    function Parents($stateProvider) {
        $stateProvider.state('parent', {
            url: '/parent',
            templateUrl: 'parents/views/index.html'
        });
    }

    angular
        .module('mean.parents')
        .config(Parents);

    Parents.$inject = ['$stateProvider'];

})();
