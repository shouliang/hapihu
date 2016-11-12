(function () {
  'use strict';

  angular
    .module('mean.task')
    .config(task);

  task.$inject = ['$stateProvider'];

  function task($stateProvider) {
    $stateProvider.state('teacher tasks', {
      url: '/teacher/tasks?classId&page&pageItem',
      templateUrl: 'task/views/teacher/list.html'
    })
    .state('teacher task',{
        url:'/teacher/task/detail/:taskId?classId',
        templateUrl:'task/views/teacher/task.html'
    })
    .state('task statistic',{
      url:'/teacher/task/statistic/:taskId?classId',
      templateUrl:'task/views/teacher/statistic.html'
    })
    .state('task schooler list',{
        url:'/school/task/list?page&pageItem',
        templateUrl:'task/views/schooler/list.html'
    })
    .state('task schooler statistic',{
        url:'/school/task/statistic/:taskId?classIds',
        templateUrl:'task/views/schooler/statistic.html'
    })
    .state('task schooler statistic_class',{
        url:'/school/task/statistic_class/:taskId?classIds',
        templateUrl:'task/views/schooler/statistic_class.html'
    })
    .state('task union statistic',{
        url:'/union/task/statistic/:taskId?classIds&schoolId',
        templateUrl:'task/views/unioner/statistic.html'
    })
    .state('task union statistic_class',{
        url:'/union/task/statistic_class/:taskId?classIds&schoolId',
        templateUrl:'task/views/unioner/statistic_class.html'
    })
    .state('task class statistic',{
        url:'/teacher/task/statistic_class/:taskId?classId',
        templateUrl:'task/views/teacher/statistic_class.html'
    })
    .state('task check',{
        url:'/teacher/task/check/:taskId?classId',
        templateUrl:'task/views/teacher/check.html'
    })
    .state('task check question',{
        url:'/teacher/task/check_question/:taskId?classId&topicId',
        templateUrl:'task/views/teacher/check_question.html'
    })
    .state('student tasks', {
        url: '/student/tasks?status&subject&page&pageItem',
        templateUrl: 'task/views/student/list.html'
    })
    .state('student task',{
        url:'/student/task/detail/:taskId',
        templateUrl:'task/views/student/task.html'
    })
    .state('upload task',{
        url:'/student/task/upload/:taskId',
        templateUrl:'task/views/student/upload.html'
    })
    .state('taskExe',{  //not for owner
        url:'/taskExe/detail/:taskExeId',
        templateUrl:'task/views/taskExe.html'
    })
    .state('student taskExe',{
        url:'/student/taskExe/detail/:taskExeId',
        templateUrl:'task/views/student/taskExe.html'
    })
    .state('student report',{
        url:'/student/taskExe/report/:taskExeId',
        templateUrl:'task/views/student/report.html'
    })
    .state('admin taskExeImg',{
        url:'/admin/taskExeImg',
        templateUrl:'task/views/admin/taskExeImg-list.html'
    })
    .state('child tasks', {
        url: '/parent/tasks?status&subject&page&pageItem',
        templateUrl: 'task/views/parent/list.html'
    })
    .state('child statistic', {
      url: '/parent/statistic/:taskId',
      templateUrl: 'task/views/parent/statistic.html'
    })
    .state('child task', {
        url: '/parent/task/detail/:taskId',
        templateUrl: 'task/views/parent/task.html'
    })
    .state('child taskExe', {
        url: '/parent/taskExe/detail/:taskExeId/:childrenId',
        templateUrl: 'task/views/parent/taskExe.html'
    });
  }
})();
