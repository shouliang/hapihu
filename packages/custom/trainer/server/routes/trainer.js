(function () {
    'use strict';

    /* jshint -W098 */
    // The Package is past automatically as first parameter
    module.exports = function (Trainer, app, auth) {
        var paper = require('../controllers/paper')();
        app.get('/api/trainer/zxxk/paper', paper.all);
        app.post('/api/trainer/zxxk/paper', paper.create);
        app.get('/api/trainer/zxxk/paper/:paperId', paper.show);
        app.post('/api/trainer/zxxk/paper/:paperId', paper.create);
        app.delete('/api/trainer/zxxk/paper/:paperId', paper.destroy);
        app.param('paperId', paper.paper);

        // 缓存题目
        app.post('/api/trainer/zxxk/question', paper.createQuestion);

        //--- 学科网通用接口API
        var zxxk = require('../controllers/zxxk')();

        // 缓存章节
        app.post('/api/trainer/zxxk/bookNodeList', zxxk.bookNodeList);

        // 获取一个学段下的科目 学段 1：小学；2：初中；3：高中
        app.get('/api/zxxk/subjectList', zxxk.getSubjectList);

        // 获取一个学科下的教材版本列表 /api/getVersionList
        app.get('/api/zxxk/getVersionList', zxxk.getVersionList);

        // 获取一个版本下的教材册别信息 /api/getTextbookList
        app.get('/api/zxxk/getTextbookList', zxxk.getTextbookList);

        // 获取一个学科下的所有试题类型
        app.get('/api/zxxk/getQuestionTypeList', zxxk.getQuestionTypeList);

        // 创建所有学科下的知识点到本地数据库
        app.get('/api/zxxk/createKnowledgePointList', zxxk.createKnowledgePointList);


        //--- 题库资源API
        // 通过教材章节获取试题列表信息 /api/getSyncChapterQuestionList
        app.get('/api/zxxk/getSyncChapterQuestionList', zxxk.getSyncChapterQuestionList);

        // 通过知识点获取试题列表 /api/getKnowledgePointQuestionList
        app.get('/api/zxxk/getKnowledgePointQuestionList', zxxk.getKnowledgePointQuestionList);

        // 获取单个试题的答案和解析
        app.get('/api/zxxk/getAnswerAndAnalyze', zxxk.getAnswerAndAnalyze);


        // 插入学科及其问题类型
        app.get('/api/zxxk/insertSubject', zxxk.insertSubject);

        app.get('/api/zxxk/insertVersions', zxxk.insertVersions);

        app.get('/api/zxxk/insertBooks', zxxk.insertBooks);


        //trainer 相关接口
        var trainer = require('../controllers/trainer')();
        app.get('/api/trainer/getTrainee', auth.requiresLogin, trainer.getTrainee); //返回{result:1,data:{count:x,list:[]}}
        app.get('/api/trainer/getKlass', auth.requiresLogin, trainer.getKlass); //返回{result:1,data:{count:x,list:[]}}
    };
})();
