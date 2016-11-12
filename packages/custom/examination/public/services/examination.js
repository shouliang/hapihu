(function() {
    'use strict';
    angular
        .module('mean.examination')
        .factory('Examination', Examination);

    Examination.$inject = ['$http', '$resource'];
    
    function Examination($http,$resource) {
        return {
            name: 'examination',
            checkerTask:$resource('/api/checker/tasks', {}, {}),
            checkerTaskQuestion:$resource('/api/task/checker/:taskId', { taskId:'@taskId'}, {}),
            checkerCheckTopic:$resource('/api/taskTopic/checker/:taskId',{
                taskId:'@taskId',
                topicId:'@topicId'
            },{
                query:{
                    method:'GET',
                    isArray:false
                }
            }),
            teacherExamTopics:$resource('/api/teacher/topics/:topicId', {
                topicId: '@_id'
            }, {
                update: {
                    method: 'PUT'
                },
                search:{
                    method:'POST'
                },
                remove:{
                    method:"DELETE"
                }
            })
        };
    }

    

})();
