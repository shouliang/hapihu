/**
 * Created by shouliang on 2016/9/20.
 */
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
var mongoose = require('mongoose');
var async = require('async');
var _ = require('lodash');
var cluster = require('cluster');

module.exports = {

    jobMyAnswerRightrate: function () {
        if((process.env.NODE_ENV!=='production') || cluster.worker.id===1){
            rule.second = 0;
            rule.minute = 30;
            rule.hour = 0;  //每天0点30分0秒执行
            console.log("schedule task 'myAnswerRightrate' start");
            schedule.scheduleJob(rule, function () {
                myAnswerRightrate();
            });
        }
    }

};

// 题目正确率定时任务
function myAnswerRightrate() {
    var MyAnswer = mongoose.model('MyAnswer');

    async.auto({
        getMyAnswer: function (callback) {
            MyAnswer.find({})
                .populate('topic', '_id')
                .exec(function (err, myanswers) {
                    if (err) return callback(err);
                    callback(null, myanswers);
                })
        },
        rightRateOfTopics: ['getMyAnswer', function (callback, results) {
            var rightRateOfTopics = [];

            var myAnswers = _.groupBy(results.getMyAnswer, 'topic._id'); // 通过题目Id进行分组
            for (var topic in myAnswers) {
                var myanswersOfAtopic = myAnswers[topic];
                var rightAnswers = _.filter(myanswersOfAtopic, {mark: '对'});
                var rightRate = Math.round((rightAnswers || []).length / myanswersOfAtopic.length * 100);
                rightRateOfTopics.push({topicId: topic, rightRate: rightRate});
            }
            callback(null, rightRateOfTopics);
        }]
    }, function (err, results) {
        if (err) return err;

        var Topic = mongoose.model('Topic');
        var rightRateOfTopics = results.rightRateOfKnowledge || [];
        var fnTasks = [];
        for (var i = 0; i < rightRateOfTopics.length; i++) {
            fnTasks.push(
                (function (topic) {
                    return function (callback) {
                        Topic.update({_id: topic.topicId}, {'statistics.rightRate': topic.rightRate}, function (err) {
                            if (err) return callback(err);
                            callback(null, null);
                        })
                    }
                })(rightRateOfTopics[i])
            );
        }

        async.parallel(fnTasks, function (err, results) {
            if (err) return err;
        })
    });
}




