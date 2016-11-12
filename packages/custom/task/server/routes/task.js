(function () {
    'use strict';

    /* jshint -W098 */
    // The Package is past automatically as first parameter
    module.exports = function (Task, app, auth, database) {
        var task = require('../controllers/task')(Task);
        app.post('/api/task', auth.requiresLogin, task.create);
        app.get('/api/task/:taskId', auth.requiresLogin, task.find);
        app.put('/api/task/:taskId', auth.requiresLogin, task.update);
        app.delete('/api/task/:taskId', auth.requiresLogin, task.delete);
        app.get('/api/task/knowledge/rightRate/:taskId', auth.requiresLogin, task.getTaskKnowledgeRightRate);
        app.get('/api/exam/knowledge/rightRate/:taskId', auth.requiresLogin, task.getExamKnowledgeRightRate);
        //app.get('/api/task/knowledge/rightRate', task.getTaskKnowledgeRightRate);

        app.get('/api/student/task/knowledge/rightRate', auth.requiresLogin, task.getStudentTaskKnowledgeRightRate);
        //app.get('/api/student/task/knowledge/rightRate', task.getStudentTaskKnowledgeRightRate);

        app.get('/api/student/task/executedRate', auth.requiresLogin, task.getStudentTaskExecutedRate);
        //app.get('/api/student/task/executedRate', task.getStudentTaskExecutedRate);

        app.get('/api/teacher/tasks', auth.requiresLogin, task.teacherTasks);
        app.get('/api/student/tasks', auth.requiresLogin, task.studentTasks);
        app.get('/api/schooler/tasks', auth.requiresLogin, task.schoolerTasks);
        app.post('/api/answerTask/:taskId', auth.requiresLogin, task.answerTask);

        //taskexe
        app.get('/api/taskExe/:taskExeId', auth.requiresLogin, task.findTaskExe);
        app.get('/api/taskExe/resource/:taskExeId', auth.requiresLogin, task.findTaskExeResource);
        app.put('/api/taskExe/:taskExeId', auth.requiresLogin, task.updateTaskExe);
        app.post('/api/taskExeAllStatus', auth.requiresLogin, task.updateAllStatus);

        //taskTopic ，获取所有或者部分题目的批改情况
        app.get('/api/taskTopic/:taskId', auth.requiresLogin, task.taskTopicsCheck);


        //admin task
        var adminTask = require('../controllers/adminTask')(Task);
        app.get('/api/startRecognizeImg', auth.requiresLogin, auth.requiresAdmin, adminTask.startRecognize);
        app.get('/api/taskExeImg', auth.requiresLogin, auth.requiresAdmin, adminTask.taskExeImgs);

        //task checker
        app.post('/api/task/checker/relate/:taskId', auth.requiresLogin, task.relateChecker);         // 关联checker
        app.delete('/api/task/checker/relate/:taskId', auth.requiresLogin, task.delRelateChecker);    // 删除关联的checker
        app.get('/api/checker/tasks', auth.requiresLogin, task.checkerTasks);                         // checker的试卷列表
        app.get('/api/task/checker/:taskId', auth.requiresLogin, task.checkerFindTask);               // checker某次试卷的题目信息
        app.get('/api/taskTopic/checker/:taskId', auth.requiresLogin, task.examTaskTopicsCheck);      // 获取所有或者部分题目的批改情况


        app.param('taskExeId', task.taskExe);
        app.param('taskId', task.task);
    };
})();
