(function () {
    'use strict';


    var hasAuthorization = function (req, res, next) {
        if (!req.user.isAdmin && !req.book.user._id.equals(req.user._id)) {
            return res.status(401).send('User is not authorized');
        }
        next();
    };
    var hasPermissions = function (req, res, next) {

        if (req.user.roles.indexOf['admin'] === -1 && req.user.roles.indexOf['vendor'] === -1) {
            return res.status(401).send('抱歉，你没有权限访问此页面');
        }
        next();
    };
    module.exports = function (Books, app, auth, database) {
        var books = require('../controllers/books')(Books);
        //admin books

        //vendor books
        app.get('/api/vendor/books', auth.requiresLogin, hasPermissions, books.venderBooks);
        app.get('/api/vendor/books/group', auth.requiresLogin, hasPermissions, books.venderBooksGroup);
        //最新修改记录
        app.get('/api/vendor/books/latestUpdated', auth.requiresLogin, hasPermissions, hasAuthorization, books.latestUpdated);

        app.post('/api/vendor/books', auth.requiresLogin, hasPermissions, books.create);
        app.get('/api/vendor/books/:bookId', auth.requiresLogin, hasPermissions, hasAuthorization, books.show);
        app.put('/api/vendor/books/:bookId', auth.requiresLogin, hasPermissions, hasAuthorization, books.update);
        app.delete('/api/vendor/books/:bookId', auth.requiresLogin, hasPermissions, hasAuthorization, books.destroy);


        //vendor book
        var book = require('../controllers/book')(Books);

        app.get('/api/book/:bookId', auth.requiresLogin, hasPermissions, hasAuthorization, book.show); // can set buy permission
        app.put('/api/vendor/book/:bookId', auth.requiresLogin, hasPermissions, hasAuthorization, book.updateContent);
        app.delete('/api/vendor/book/:bookId', auth.requiresLogin, hasPermissions, hasAuthorization, book.destroy);

        //出版社强制同步最新书到老师书/学生书
        app.get('/api/vendor/synchronize/:bookId', auth.requiresLogin, hasPermissions, hasAuthorization, book.synchronize);


        //user books
        app.get('/api/books', auth.requiresLogin, books.all);


        //vendor topics
        var topics = require('../controllers/topics')(Books);
        app.get('/api/vendor/topics', auth.requiresLogin, hasPermissions, topics.all);
        app.post('/api/vendor/topics/search', auth.requiresLogin, hasPermissions, topics.all);
        app.post('/api/vendor/topics', auth.requiresLogin, hasPermissions, topics.handleImg, topics.create);
        app.get('/api/vendor/topics/:topicId', auth.requiresLogin, hasPermissions, hasAuthorization, topics.show);
        app.put('/api/vendor/topics/:topicId', auth.requiresLogin, hasPermissions, hasAuthorization, topics.handleImg, topics.update);
        app.delete('/api/vendor/topics/:topicId', auth.requiresLogin, hasPermissions, hasAuthorization, topics.destroy);

        // 题库
        app.post('/api/teacher/topics', auth.requiresLogin, topics.handleImg, topics.create);
        app.delete('/api/teacher/topics/:topicId', auth.requiresLogin, topics.destroy);
        app.put('/api/teacher/topics/:topicId', auth.requiresLogin, topics.handleImg, topics.update);
        app.get('/api/teacher/topics/:topicId', auth.requiresLogin, topics.show);
        app.get('/api/teacher/topics', auth.requiresLogin, topics.all);
        app.post('/api/teacher/topics/search', auth.requiresLogin, topics.all);

        //批量获取 topics
        app.post('/api/topics/all', auth.requiresLogin, topics.all);
        app.post('/api/topics/childrenAll', auth.requiresLogin, topics.childAll);
        app.get('/api/topics/:topicId', auth.requiresLogin, topics.show);

        //回答问题
        app.post('/api/answerTopic/:topicId', auth.requiresLogin, topics.answerTopic);
        app.post('/api/myAnswer/:myAnswerId', auth.requiresLogin, topics.updateMyAnswer);
        app.param('myAnswerId', topics.myAnswer);

        var myAnswer = require('../controllers/myAnswer')();
        app.get('/api/myAnswer/errors', myAnswer.allErrors); //错题查询
        app.get('/api/myAnswer/statistics/:taskId', auth.requiresLogin, myAnswer.statistics);           //作业统计
        app.get('/api/myAnswer/exam_statistics/:taskId', auth.requiresLogin, myAnswer.exam_statistics); //考试统计

        //教材版本
        var editions = require('../controllers/editions')();
        app.get('/api/admin/editions', auth.requiresLogin, editions.all);
        app.post('/api/admin/editions', auth.requiresLogin, auth.requiresAdmin, editions.create);
        app.put('/api/admin/editions/:editionId', auth.requiresLogin, auth.requiresAdmin, editions.update);
        app.delete('/api/admin/editions/:editionId', auth.requiresLogin, auth.requiresAdmin, editions.destroy);


        //买书及验证
        app.get('/api/orderbook/:bookId', auth.requiresLogin, book.order);
        // app.delete('/api/orderbook/:bookId', auth.requiresLogin,  book.delete);
        app.get('/api/orderstatus/:bookId', auth.requiresLogin, book.orderStatus);

        //老师使用书
        var teacherBook = require('../controllers/teacherBook')();
        app.get('/api/tbook/:tbookId', auth.requiresLogin, teacherBook.find);
        app.get('/api/tbook', auth.requiresLogin, teacherBook.all);

        //学生用书
        var studentBook = require('../controllers/studentBook')();
        app.get('/api/sbook/:sbookId', auth.requiresLogin, studentBook.find);
        app.get('/api/sbook', auth.requiresLogin, studentBook.all);

        // 知识体系
        var knowledgeSystem = require('../controllers/knowledgeSystem')();
        app.get('/api/vendor/knowledgeSystem', auth.requiresLogin, knowledgeSystem.all);
        app.get('/api/vendor/knowledgeSystem/:konwledgeSystemId', auth.requiresLogin, knowledgeSystem.show);
        app.get('/api/vendor/knowledgeSystemNames', auth.requiresLogin, knowledgeSystem.allNames);
        app.post('/api/vendor/knowledgeSystem', auth.requiresLogin, knowledgeSystem.create);
        app.put('/api/vendor/knowledgeSystem/:konwledgeSystemId', auth.requiresLogin, knowledgeSystem.update);
        app.delete('/api/vendor/knowledgeSystem/:konwledgeSystemId', auth.requiresLogin, knowledgeSystem.destroy);

        // 知识点
        var knowledge = require('../controllers/knowledge')();
        app.get('/api/knowledge', auth.requiresLogin, knowledge.all);
        app.post('/api/knowledge', auth.requiresLogin, knowledge.create);

        app.put('/api/knowledge/:konwledgeId', auth.requiresLogin, knowledge.update);
        app.get('/api/knowledge/:parent', auth.requiresLogin, knowledge.getFirstChildrens);
        app.delete('/api/knowledge/:konwledgeId', auth.requiresLogin, knowledge.destroy);
        // 资源
        var resource = require('../controllers/resource')();
        app.get('/api/vendor/resource', auth.requiresLogin, resource.all);
        app.get('/api/vendor/resource/:resourceId', auth.requiresLogin, resource.show);
        app.post('/api/vendor/resource', auth.requiresLogin, resource.handleImg, resource.create);
        app.put('/api/vendor/resource/:resourceId', auth.requiresLogin, resource.handleImg, resource.update);
        app.delete('/api/vendor/resource/:resourceId', auth.requiresLogin, resource.destroy);
        app.get('/api/vendor/handelImg', auth.requiresLogin, resource.handleImgs);

        // 书本图片
        var bookImage = require('../controllers/bookImage')();
        app.get('/api/vendor/bookImage/:bookId', auth.requiresLogin, bookImage.all);
        app.put('/api/vendor/bookImage/:bookImageId', auth.requiresLogin, bookImage.update);
        app.delete('/api/vendor/bookImage/:bookImageId', auth.requiresLogin, bookImage.destroy);
        app.post('/api/vendor/bookImage/bulkCreate/:bookId', auth.requiresLogin, bookImage.bulkCreate);

        //update topic image.stemImg to stem  image array
        app.get("/api/admin/updateTopicImg",auth.requiresLogin,topics.updateTopicImg);

        // 试卷图片
        var paperImage = require('../controllers/paperImage')();
        app.get('/api/teacher/paperImages/:taskId', auth.requiresLogin, paperImage.all);
        app.put('/api/teacher/paperImage/:paperImageId', auth.requiresLogin, paperImage.update);
        app.delete('/api/teacher/paperImage/:paperImageId', auth.requiresLogin, paperImage.destroy);
        app.post('/api/teacher/paperImage/bulkCreate/:taskId', auth.requiresLogin, paperImage.bulkCreate);

        //组卷及相关
        var papers = require('../controllers/papers')();
        app.get('/api/paper/subject',papers.getSubject);
        app.get('/api/paper/subject/:subjectId',papers.getSubject);

        app.param('bookId', books.book);
        app.param('tbookId', teacherBook.tbook);
        app.param('sbookId', studentBook.sbook);
        app.param('topicId', topics.topic);
        app.param('editionId', editions.edition);
        app.param('konwledgeSystemId', knowledgeSystem.knowledgeSystem);
        app.param('konwledgeId', knowledge.knowledge);
        app.param('resourceId', resource.resource);
        app.param('bookImageId', bookImage.bookImage);
        app.param('paperImageId', paperImage.paperImage);
        app.param('subjectId',papers.subject)

        // //error handler
        // app.use(function (err,req,res,next) {
        //   console.log("errrrr:",err);
        //   if(req.xhr){
        //     res.status(500).send("出错了");
        //   }
        // });
    };
})();
