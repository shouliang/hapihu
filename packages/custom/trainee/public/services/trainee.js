(function() {
    'use strict';
    angular
        .module('mean.trainee')
        .factory('Trainee', Trainee);

    Trainee.$inject = ['$resource'];
    
    function Trainee($resource) {
        return {
            name: 'trainee',
            getTraineeTask:$resource('/api/student/tasks',{},{}),
            topics:$resource('api/topics/:topicId',{
                topicId:'@topicId'
            },{
                query:{
                    method:'POST',
                    isArray:false
                }
            }),
            task:$resource('/api/task/:taskId',{
                taskId:'@taskId'
            },{
                update:{
                    method:'PUT'
                }
            }),
            taskExe:$resource('/api/taskExe/:taskExeId',{
                taskExeId:'@taskExeId'
            },{
                update:{
                    method:'PUT'
                }
            })
        };
    }

    

})();
