(function() {
    'use strict';

    angular
        .module('mean.trainer')
        .config(Trainer);

    Trainer.$inject = ['$stateProvider'];
    function Trainer($stateProvider) {
        $stateProvider.state('trainer', {
            url: '/trainer',
            templateUrl: 'trainer/views/index.html'
        }).state('trainer student collectionNoteBook', {
            url: '/trainer/student/collectionNoteBook/:userId',
            templateUrl: 'trainer/views/collectionNoteBook.html'
        }).state('trainer student list', {
            url: '/trainer/student/list/:userId',
            templateUrl: 'trainer/views/list.html'
        }).state('trainer student statistic', {
            url: '/trainer/student/statistic/:userId',
            templateUrl: 'trainer/views/statistic.html'
        }).state('trainer student examinations', {
            url: '/trainer/student/examinations/:klassId/:userId',
            templateUrl: 'trainer/views/examinations.html'
        }).state('trainer create', {
            url: '/trainer/student/create',
            templateUrl: 'trainer/views/create.html'
        }).state('trainer taskExe', {
            url: '/trainer/student/taskExe/:taskExeId',
            templateUrl: 'trainer/views/taskExe.html'
        }).state('trainer student', {
            url: '/trainer/student/student',
            templateUrl: 'trainer/views/student.html'
        }).state('trainer klasses', {
            url: '/trainer/student/klasses',
            templateUrl: 'trainer/views/klasses.html'
        }).state('trainer klass detail', {
            url: '/trainer/student/klass/detail/:klassId',
            templateUrl: 'trainer/views/klassDetail.html'
        }).state('trainer student characterExe', {
            url: '/trainer/student/characterExe',
            templateUrl: 'trainer/views/characterExe.html'
        }).state('trainer studentExe upload', {
            url: '/trainer/student/characterExe/upload/:taskId',
            templateUrl: 'trainer/views/upload.html'
        });
    }
})();
