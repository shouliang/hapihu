(function() {
    'use strict';
    angular
        .module('mean.examination')
        .config(Examination);

    Examination.$inject = ['$stateProvider'];
    function Examination($stateProvider) {
        $stateProvider.state('examination list', {
            url: '/examination/examinationList',
            templateUrl: 'examination/views/list.html'
        }).state('examination check', {
            url: '/examination/check/:taskId',
            templateUrl: 'examination/views/check.html'
        }).state('examination check question', {
            url: '/examination/check_question/:taskId?topicId',
            templateUrl: 'examination/views/check_question.html'
        }).state('groupExam list', {
            url: '/examination/groupExam/list',
            templateUrl: 'examination/views/groupExam/list.html'
        }).state('groupExam create', {
            url: '/examination/groupExam/create',
            templateUrl: 'examination/views/groupExam/create.html'
        }).state('edit groupExam',{
            url:'/question/edit/:topicId',
            params:{
                question:null
            },
            templateUrl: 'examination/views/groupExam/create.html'
        });
    }

    

})();
