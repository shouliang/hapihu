(function () {
  'use strict';

  angular
    .module('mean.task')
    .factory('Task', Task);

  Task.$inject = ['$resource'];

  function Task($resource) {
    return {
      task:$resource('/api/task/:taskId',{
        taskId:'@taskId'
      },{
        update:{
          method:'PUT'
        }
      }),
      report:$resource('/api/taskExe/resource/:taskExeId',{
        taskId:'@taskExeId'
      },{
        update:{
          method:'GET'
        }
      }),
      taskExe:$resource('/api/taskExe/:taskExeId',{
        taskExeId:'@taskExeId'
      },{
        update:{
          method:'PUT'
        }
      }),
      taskTopic:$resource('/api/taskTopic/:taskId',{
        taskId:'@taskId',
        topicId:'@topicId',
        classId:'@classId'
      },{
        query:{
          method:'GET',
          isArray:false
        }
      }),
      teacherTasks:$resource('/api/teacher/tasks',{}),
      teacherCheckAll:$resource('/api/taskExeAllStatus',{},{update:{method:'POST'}}),
      studentTasks:$resource('/api/student/tasks',{}),
      childTasks:$resource('/api/parents/childrenTasks',{childrenIds:'@childrenIds'}),
      answerTask:$resource('/api/answerTask/:taskId',{taskId:'@taskId'}),
      taskStatistics:$resource('/api/myAnswer/statistics/:taskId',{},
          {
            query:{
              method:'GET',
              isArray:false
            }
          }
      ),
      taskKnowledge:$resource('/api/task/knowledge/rightRate/:taskId'),
      studentKnowledge:$resource('/api/student/task/knowledge/rightRate'),
      taskChecker:$resource('/api/task/checker/relate/:taskId',{},{delete:{method:'DELETE'}}),
      schoolerTasks:$resource('/api/schooler/tasks',{}),
      schoolerClassStatistic:$resource('/api/exam/knowledge/rightRate/:taskId',{},
          {
            query:{
              method:'GET',
              isArray:false
            }
          })
    };
  }
})();
