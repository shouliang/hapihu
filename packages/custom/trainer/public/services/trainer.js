(function() {
    'use strict';

    angular
        .module('mean.trainer')
        .factory('Trainer', Trainer);

    Trainer.$inject = ['$resource'];
    
    function Trainer($resource) {
        return {
            name: 'trainer',
            getTrainees:$resource('/api/trainer/getTrainee', {}, {}),
            getTraineeKlass:$resource('/api/trainer/getKlass'),
            TerCollectionNotebook:$resource('api/myAnswer/errors', {
            }, {
                update: {
                    method: 'PUT'
                }
            }),
            TeeTasks:$resource('/api/student/tasks',{},{}),
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
            }),
            myAnswer:$resource('api/myAnswer/:myAnswerId',{
                myAnswerId:'@myAnswerId'
            }),
            answerTask:$resource('/api/answerTask/:taskId',{taskId:'@taskId'}),
        };
    }

    

})();
