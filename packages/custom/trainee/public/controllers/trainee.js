(function() {
    'use strict';

    /* jshint -W098 */
    angular
        .module('mean.trainee')
        .controller('TraineeController', TraineeController);

    TraineeController.$inject = ['$scope', 'Global', 'Trainee', '$stateParams'];

    function TraineeController($scope, Global, Trainee, $stateParams) {
        $scope.global = Global;
        $scope.package = {
            name: 'trainee'
        };
    }
    angular.module('mean.trainee')

    .controller('traineeTasksController',function ($scope,$state,Trainee,MeanUser) {
        var vm = this;
        $scope.query ={};
        vm.init= function () {
            loadData();
        };
        var loadData = function (page,pageItem) {
            page = page||1;
            var query = angular.extend({page: page, pageItem: pageItem}, $scope.query);
            Trainee.getTraineeTask.get(query,function (res) {
                $scope.tasks  = res.data;
                var advices = [
                    {
                        min: 0,
                        max: 60,
                        mark: '较差'
                    },
                    {
                        min: 60,
                        max: 70,
                        mark: '一般'
                    },
                    {
                        min: 70,
                        max: 85,
                        mark: '良好'
                    },
                    {
                        min: 85,
                        max: 101,
                        mark: '很好'
                    }
                ];
                for (var i = 0; i < $scope.tasks.list.length; i++) {
                    if ($scope.tasks.list[i].done && $scope.tasks.list[i].taskExe.statistics) {
                        var rightRate = $scope.tasks.list[i].taskExe.statistics.rightRate;
                        for (var j = 0; j < advices.length; j++) {
                            if (rightRate >= advices[j].min && rightRate < advices[j].max) {
                                $scope.tasks.list[i].advice = advices[j];
                                break;
                            }
                        }
                    }
                }
            },function (res) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "获取试卷失败"
                });
            });
        };
       
        vm.queryFetch = function () {
            var pageItem = ($scope.tasks && $scope.tasks.pageItem) ? vm.books.pageItem : 20;
            loadData(1, pageItem);
        };
        vm.selectPage = function (page, $event) {
            var pageItem = ($scope.tasks && $scope.tasks.pageItem) ? $scope.tasks.pageItem : 20;
            loadData($scope.tasks.page, pageItem);
        };

    })
    .controller('TraineeTaskController',function ($scope,$state,Trainee,MeanUser) {
        var vm = this;
        vm.init = function () {
            if($state.params.taskId) return getTaskByTaskId();
            if ($state.params.taskExeId){
                return getTaskByTaskExeId();
            } else {
                $scope.taskExe ={};
            }
            $scope.advice ={
                mark:'',
                content:''
            }

        };
        var getTaskByTaskId = function () {
            Trainee.task.get({taskId: $state.params.taskId}, function (res) {
                if (res.result) {
                    $scope.task = res.data;
                    if ($scope.task.content.topics && $scope.task.content.topics.length > 0) {
                        //get questions
                        Trainee.topics.query({
                            topicId: 'all',
                            pageItem: $scope.task.content.topics.length
                        }, {topicIds: $scope.task.content.topics}, function (res) {
                            if (res.result) {
                                $scope.questions = res.data;
                            }
                        }, function (res) {
                            $scope.toasty.error({
                                title: "╮(╯_╰)╭",
                                msg: "获取题目失败"
                            });
                        });
                    }
                }

            }, function (res) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "获取作业失败"
                });
            });

        };
        var getAdvice = function () {
            if (!$scope.taskExe || !$scope.taskExe.statistics) return;
            var rightRate = parseInt($scope.taskExe.statistics.rightRate);
            var advices = [
                {
                    min: 0,
                    max: 60,
                    mark: '较差',
                    content: '此知识点还未能掌握，请继续学习'
                },
                {
                    min: 60,
                    max: 70,
                    mark: '一般',
                    content: '此知识点基本一般，建议继续学习'
                },
                {
                    min: 70,
                    max: 85,
                    mark: '良好',
                    content: '此知识点基本掌握'
                },
                {
                    min: 75,
                    max: 101,
                    mark: '很好',
                    content: '此知识点很好的掌握了'
                }
            ];
            for (var i = 0; i < advices.length; i++) {
                if (rightRate >= advices[i].min && rightRate < advices[i].max) {
                    $scope.advice = advices[i];
                    break;
                }
            }
        };
        var getTaskByTaskExeId = function () {
            //查看作业结果
            Trainee.taskExe.get({taskExeId: $state.params.taskExeId}, function (res) {
                if (res.result) {
                    $scope.taskExe = res.data;
                    $scope.task = $scope.taskExe.task;
                    if ($scope.taskExe.topics) {
                        $scope.questions = {
                            count: $scope.taskExe.topics.length,
                            list: $scope.taskExe.topics
                        };
                    }
                    getAdvice();
                }

            }, function (res) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "获取作业失败"
                });
            });
        };
        vm.changeTaskExe = function (att) {
            if (att === 'remark') {
                updateTaskExe({remark: $scope.taskExe.remark});
            } else if (att === 'comment') {
                if (!$scope.newComment) return;
                var comment = {
                    userId: MeanUser.user._id,
                    username: MeanUser.user.username,
                    name: MeanUser.user.name,
                    type: MeanUser.user.userType,
                    comment: $scope.newComment,
                    created: Date.now()
                };
                updateTaskExe({comment: comment}, function (err, res) {
                    if (err) {

                    } else {
                        $scope.taskExe.comments.push(comment);
                        $scope.newComment = '';
                    }
                });
            }
        };
        var updateTaskExe = function (content, callback) {
            Trainee.taskExe.update({taskExeId: $scope.taskExe._id}, content, function (res) {
                $scope.toasty.success({
                    title: "╮(╯_╰)╭",
                    msg: "保存成功"
                });
                if (callback) {
                    callback(null, res);
                }

            }, function (res) {
                $scope.toasty.success({
                    title: "╮(╯_╰)╭",
                    msg: "保存失败"
                });
                callback(res);
            });
        };

    })
    .controller('TraineeStatisticController',function ($scope,$state,Trainee,MeanUser) {
        var  vm = this;
        vm.init = function () {
            loadData();
        };
        var loadData = function () {
            Trainee.getTraineeTask.get({},function (res) {
                $scope.tasks  = res.data;
            },function (res) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "获取试卷失败"
                });
            });
        }

    })
    .controller('TraineeController',function ($scope, $state,MeanUser,Trainee,$timeout) {
        var vm = this;
        vm.init = function () {
            Trainee.getTraineeTask.get({page:1,pageItem:3},function (res) {
                $scope.tasks  = res.data;
            },function (res) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "获取试卷失败"
                });
            });
            vm.checkNotification();
        };
        vm.checkNotification=function () {
            if(vm.notificationLoading) return;
            vm.notificationLoading=true;
            MeanUser.checkNotification().then(function (res) {
                $timeout(function () {
                    vm.notificationLoading=false;
                },2000);
            },function () {
                $timeout(function () {
                    vm.notificationLoading=false;
                },2000);
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"获取新消息失败"
                });
            });
        };
        vm.clearNew=function () {
            MeanUser.readedNotification();
        }
    })

})();
