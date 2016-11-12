'use strict';

angular
    .module('mean.books')
    .factory('Papers', function($resource,$http) {
        var paper={
            topicIds:[],
            topics:{}
        };
        return {
            subject:$resource('api/paper/subject/:subjectId', {}, {}),
            getKnowledgePointQuestionList:function (params) {
              return $http({method:'GET',url:'/api/zxxk/getKnowledgePointQuestionList',params:params});
            },
            localPaper:function () {
                return paper;
            }
        };
});