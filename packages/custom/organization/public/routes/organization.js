(function() {
    'use strict';

    function Organization($stateProvider) {
        $stateProvider.state('organization', {
                url: '/organization',
                templateUrl: 'organization/views/index.html'
            })
            .state('organization trainees', {
                url: '/organization/trainees/:schoolId',
                templateUrl: 'organization/views/trainees.html'
            })
            .state('organization trainee', {
                url: '/organization/trainees/:schoolId/:userId',
                templateUrl: 'organization/views/trainee.html'
            })
            .state('organization products', {
                url: '/organization/products/:schoolId',
                templateUrl: 'organization/views/products.html'
            })
            .state('organization classes', {
                url: '/organization/classes/:schoolId',
                templateUrl: 'organization/views/classes.html'
            })
            .state('organization trainers', {
                url: '/organization/trainers/:schoolId',
                templateUrl: 'organization/views/trainers.html'
            })
            .state('organization klass', {
                url: '/organization/klass/:schoolId/:classId',
                templateUrl: 'organization/views/klass.html'
            })
            .state('organization papers', {
                url: '/organization/papers/:schoolId',
                templateUrl: 'organization/views/papers.html'
            })
            .state('organization setting', {
                url: '/organization/setting/:schoolId',
                templateUrl: 'organization/views/organization.html'
            })
        ;
    }

    angular
        .module('mean.organization')
        .config(Organization);

    Organization.$inject = ['$stateProvider'];

})();
