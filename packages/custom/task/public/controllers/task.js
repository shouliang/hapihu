(function () {
    'use strict';

    /* jshint -W098 */
    angular
        .module('mean.task')
        .controller('TaskController', TaskController);

    TaskController.$inject = ['$scope', 'Global', 'Task'];

    function TaskController($scope, Global, Task) {
        $scope.global = Global;
        $scope.package = {
            name: 'task'
        };
    }

    angular.module('mean.task')
        .controller('TeacherTasksController', function ($scope, $state, Task, MeanUser) {
            var vm = this;
            var user = MeanUser.user;
            $scope.maxSize = 10;
            vm.init = function () {
                $scope.query = {};
                $scope.page = $state.params.page || 1;
                $scope.group = {grades: [], classes: []};
                MeanUser.myClasses().then(function (res) {
                    var myClasses = MeanUser.user.profile.classes || [];
                    angular.forEach(myClasses, function (item) {
                        if (item.status.indexOf("成功") > -1) {
                            if ($scope.group.grades.indexOf(item.grade) === -1) {
                                $scope.group.grades.push(item.grade);
                            }
                            if ($scope.group.classes.indexOf(item.name) === -1) {
                                $scope.group.classes.push(item.name);
                            }
                        }
                    });
                });
                loadData();
            };
            var loadData = function (page, pageItem) {
                page = page || 1;
                pageItem = pageItem || 20;
                var query = angular.extend({page: page, pageItem: pageItem}, $scope.query);
                Task.teacherTasks.get(query, function (res) {
                    if (res.result) {
                        $scope.tasks = res.data;
                    }

                }, function (res) {

                });
            };
            vm.queryFetch = function () {
                var pageItem = (vm.books && vm.books.pageItem) ? vm.books.pageItem : 20;
                loadData(1, pageItem);
            };
            vm.selectPage = function (page, $event) {
                var pageItem = ($scope.tasks && $scope.tasks.pageItem) ? $scope.tasks.pageItem : 20;
                loadData($scope.tasks.page, pageItem);
            };
            // $scope.selectClass=function (classId) {
            //     $scope.selectedClassId=classId;
            //     var pageItem=($scope.tasks && $scope.tasks.pageItem)?$scope.tasks.pageItem:2;
            //     loadData(1,pageItem,classId);
            // }
        })
        .controller('TeacherTaskController', function ($scope, $state, Task, Books) {
            if (!$state.params.taskId) return;
            Task.task.get({taskId: $state.params.taskId}, function (res) {
                if (res.result) {
                    $scope.task = res.data;
                    if (!$scope.selectedClassId && $scope.task.to.length > 0) {
                        $scope.selectedClassId = $scope.task.to[0].classId;
                    }
                    if ($scope.selectedClassId && $scope.task.to.length > 0) {
                        for (var i = 0; i < $scope.task.to.length; i++) {
                            if ($scope.task.to[i].classId === $scope.selectedClassId) {
                                $scope.selectedClass = $scope.task.to[i];
                            }
                        }
                    }
                    if ($scope.task.content.topics && $scope.task.content.topics.length > 0) {
                        //get questions
                        Books.topics.query({
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
        })
        .controller('TaskStatisticController', function ($scope, $state, Task,MeanUser) {
            var vm = this;
            $scope.user=MeanUser.user;
            $scope.selectedClassId = $state.params.classId;
            vm.init = function () {
                if (!$state.params.taskId) return;
                Task.task.get({taskId: $state.params.taskId, classId: $scope.selectedClassId}, function (res) {
                    if (res.result) {
                        $scope.task = res.data;
                        if ($scope.selectedClassId && $scope.task.to.length > 0) {
                            for (var i = 0; i < $scope.task.to.length; i++) {
                                if ($scope.task.to[i].classId === $scope.selectedClassId) {
                                    $scope.selectedClass = $scope.task.to[i];
                                }
                            }
                        } else {
                            if ($scope.task.to.length === 1) {
                                $scope.selectedClass = {name: $scope.task.to[0].name};
                            } else {
                                $scope.selectedClass = {name: '全部'};
                            }
                        }

                    }
                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "获取作业失败"
                    });
                });
            };
            vm.changeAllSelected = function () {
                $scope.task.allSelected = !$scope.task.allSelected;
                if ($scope.task.executors) {
                    angular.forEach($scope.task.executors, function (item) {
                        if (item.taskExe) {
                            item.selected = $scope.task.allSelected;
                        }
                    });
                }
            }
            $scope.sortCondition = {
                sort: '',
                reverse: false
            };
            $scope.sortGetter = function () {

            };
            vm.sortBy = function (att, reverse) {
                if (att === $scope.sortCondition.sort) {
                    $scope.sortCondition.reverse = !$scope.sortCondition.reverse;
                } else {
                    $scope.sortCondition.sort = att;
                    $scope.sortCondition.reverse = false;
                }

                att = att.split('.');
                $scope.sortGetter = function (item) {
                    var target = item;
                    angular.forEach(att, function (a) {
                        if (target) {
                            target = target[a];
                        } else {
                            target = null;
                        }
                    });
                    return target;
                };
            };
            vm.checkAll = function () {
                var selectedIds = [];
                angular.forEach($scope.task.executors, function (member) {
                    if (member.selected) {
                        selectedIds.push(member.taskExe._id);
                    }
                });
                if (selectedIds.length === 0) return;
                Task.teacherCheckAll.update({}, {taskExeIds: selectedIds}, function (res) {
                    $scope.sweetAlert.swal({
                        title: '批改成功',
                        text: '祝贺你！',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    // $scope.toasty.success({
                    //     title: " ｡◕‿◕｡",
                    //     msg: "批改成功"
                    // });
                    angular.forEach($scope.task.executors, function (member) {
                        if (selectedIds.indexOf(member.taskExe._id) > -1) {
                            member.taskExe.status = '已批改';
                        }
                    });
                }, function (err) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "批改失败"
                    });
                })
            };
            vm.markTask = function(task){
                $scope.sweetAlert.swal({
                    title: '确定已全部批改？',
                    text: '如果确定，系统会把所有学生的作业状态设置成已批改',
                    showCancelButton: true,
                    confirmButtonText: '确定',
                    cancelButtonText: '取消'
                }, function (isConfirmed) {
                    if (isConfirmed) {
                        var selectedIds = [];
                        Task.task.update({taskId:task._id},{status:'已批改'},function(res){
                            if(res.result==1){
                                task.status = '已批改';
                                angular.forEach($scope.task.executors, function (member) {
                                    member.taskExe.status = '已批改';
                                });
                            }
                        },function(){
                            $scope.toasty.error({
                                title:"╮(╯_╰)╭",
                                msg:"操作错误"
                            });
                        });
                    }
                });

            };
        })
        .controller('TaskClassStatisticController', function ($scope, $state, Task) {
            $scope.oneAtATime = true;
            $scope.status = {
                isCustomHeaderOpen: false,
                isFirstOpen: true,
                isFirstDisabled: false
            };
            var vm = this;
            $scope.selectedClassId = $state.params.classId;
            vm.init = function () {
                if (!$state.params.taskId) return;
                Task.task.get({taskId: $state.params.taskId, classId: $scope.selectedClassId}, function (res) {
                    if (res.result) {
                        $scope.task = res.data;
                        if ($scope.selectedClassId && $scope.task.to.length > 0) {
                            for (var i = 0; i < $scope.task.to.length; i++) {
                                if ($scope.task.to[i].classId === $scope.selectedClassId) {
                                    $scope.selectedClass = $scope.task.to[i];
                                }
                            }
                        } else {
                            if ($scope.task.to.length === 1) {
                                $scope.selectedClass = {name: $scope.task.to[0].name};
                            } else {
                                $scope.selectedClass = {name: '全部'};
                            }
                        }
                        //topic statistic
                        loadStatistics();
                        loadKnowledgeStatistics();

                        //class statistics
                        var members = $scope.task.executors.length;
                        var submitters = 0, totalTopicLen = 0, totalRight = 0;
                        var rightRateArray = [];
                        angular.forEach($scope.task.executors, function (item) {
                            if (item.taskExe) {
                                submitters++;
                            }
                            if (item.taskExe && item.taskExe.statistics) {
                                if (item.taskExe.statistics.mark) {
                                    //totalMark+=item.taskExe.statistics.mark;
                                    totalTopicLen += item.taskExe.topics.length;
                                    totalRight += item.taskExe.statistics.right;
                                    rightRateArray.push(item.taskExe.statistics.rightRate);
                                }
                            }
                        });
                        //var averageRightRate = totalTopicLen ? Math.round(totalRight / totalTopicLen * 100) : 0;
                        $scope.statistics = {
                            members: members,
                            submitters: submitters,
                            //averageRightRate: averageRightRate
                        };
                    }

                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "加载数据失败"
                    });
                });

            };
            var loadStatistics = function () {
                if (!$state.params.taskId) return;
                Task.taskStatistics.query({
                    taskId: $state.params.taskId,
                    classId: $scope.selectedClassId
                }, function (res) {
                    if (!res.result) return;
                    var statisticsTopic = res.data.list;
                    var topics = [];
                    var sumRightAnswersLen =0;
                    var sumWrongAnswersLen =0;
                    angular.forEach($scope.task.content.topics, function (item) {
                        var topic = {
                            _id: item
                        };
                        for (var i = 0; i < statisticsTopic.length; i++) {
                            if (statisticsTopic[i]._id === item) {
                                topic = statisticsTopic[i];
                            }
                        }
                        sumRightAnswersLen += topic.rightAnswers?topic.rightAnswers.length:0;
                        sumWrongAnswersLen += topic.wrongAnswers?topic.wrongAnswers.length:0;
                        topics.push(topic);
                        $scope.questions = topics;
                        updateChart();
                    });
                    $scope.averageRightRate = Math.round((sumRightAnswersLen)/(sumRightAnswersLen + sumWrongAnswersLen)*100) || 0;

                    // 作业总评
                    getAdvice($scope.averageRightRate);
                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "加载数据失败"
                    });
                });
            };
            var loadKnowledgeStatistics=function () {
                Task.taskKnowledge.get({
                    taskId:$state.params.taskId,
                    classId: $scope.selectedClassId
                },function (res) {
                    var points=res.data;
                    updateChart2(points);
                },function (res) {

                });
            };
            // 作业总评(必须这样写，因为平均正确率也是计算出来的)
            var getAdvice= function(rightRate){
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

            var updateChart = function () {
                var labels = [];
                var data = [];
                var colors = [];
                angular.forEach($scope.questions, function (item, key) {
                    labels.push('题' + (key + 1));
                    var right = item.rightRate ? item.rightRate.replace('%') : 0;
                    data.push(parseInt(right));
                    colors.push('#83e3c3');
                });

                $scope.chartLabels = labels;
                $scope.chartData = data;
                $scope.chartColors = colors;
                $scope.chartOptions = {
                    scales: {
                        xAxes: [{
                            barPercentage: 0.8
                        }],
                        yAxes: [{
                            stacked: false,
                            ticks: {
                                max: 100,
                                min: 0,
                                stepSize: 20
                            }
                        }]
                    }
                };
            };
            var isParent=function (id,all) {
                for(var i=0;i<all.length;i++){
                    if(id===all[i].parent){
                        return true;
                    }
                }
                return false;
            };
            var updateChart2=function (points) {
                var labels = [];
                var data = [];
                var colors = [];
                angular.forEach(points, function (item, key) {
                   if(isParent(item._id,points)) return;
                    labels.push(item.title);
                    var right = item.rightRate ? item.rightRate: 0;
                    data.push(parseInt(right));
                    colors.push('#83e3c3');
                });

                $scope.chartLabels2 = labels;
                $scope.chartData2 = [data];
                $scope.chartColors2 = colors;
                $scope.chartSeries2=['正确率%'];
                var lineArc=$scope.chartLabels2.length>3?false:true;
                $scope.chartOptions2 = {
                    scale: {
                        type:"radialLinear",
                        lineArc:lineArc,
                        ticks: {
                            max: 100,
                            min: 0,
                            stepSize: 20
                        },
                        scaleLabel:{
                            display:true
                        }

                    },
                    legend: {
                        display: true,
                        labels: {
                            fontColor: '#83e3c3'
                        }
                    }
                };
            };
        })
        .controller('StudentTasksController', function ($scope, $state,$stateParams, Task, MeanUser, Books) {
            var vm = this;
            var user = MeanUser.user;
            $scope.maxSize = 5;
            var subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '地理', '历史', '政治'];
            $scope.group = {};
            vm.init = function () {
                $scope.query = {};
                if($stateParams.subject){
                    $scope.query.subject=$stateParams.subject;
                }
                $scope.page = $state.params.page || 1;
                Books.studentBook.get({}, function (res) {
                    if (res.result) {
                        var books = res.data;
                        var mySubjects = [];
                        angular.forEach(books.list, function (item) {
                            if (item.subject && mySubjects.indexOf(item.subject) === -1) {
                                mySubjects.push(item.subject);
                            }
                            //排序
                            mySubjects.sort(function (a, b) {
                                return subjects.indexOf(a) - subjects.indexOf(b);
                            });
                            $scope.group.subjects = mySubjects;
                        });
                    }
                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "数据加载失败"
                    });
                });
                loadData();
            };
            var loadData = function (page, pageItem, subject) {
                page = page || 1;
                var query = angular.extend({page: page, pageItem: pageItem}, $scope.query);
                Task.studentTasks.get(query, function (res) {
                    if (res.result) {
                        $scope.tasks = res.data;
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
                    }
                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "数据加载失败"
                    });
                });
            };
            vm.queryFetch = function () {
                loadData(1, $scope.tasks.pageItem);
            };
            vm.selectPage = function (page, $event) {
                loadData($scope.tasks.page, $scope.tasks.pageItem, $scope.selectedClassId);
            };
            $scope.selectSubject = function (subject) {
                $scope.selectedSubject = subject;
                var pageItem = ($scope.tasks && $scope.tasks.pageItem) ? $scope.tasks.pageItem : 2;
                loadData(1, pageItem, subject);
            }
        })

        .controller('ChildTasksController', function ($scope, $state,$stateParams, Task, MeanUser, Books,Student) {
            var vm = this;
            $scope.query={};
            var children = ( MeanUser.user.profile && MeanUser.user.profile.children ) ? MeanUser.user.profile.children: [];
            $scope.query.childId = children[0]._id;
            $scope.userChildren = children;
            vm.init = function () {
                loadData()
            };
            var loadData =$scope.loadData = function (page,pageItem) {
                page = page || 1;
                pageItem = pageItem || 20;
                var query = angular.extend({page:page,pageItem:pageItem});
                Task.childTasks.get({childrenId:$scope.query.childId,page:page,pageItem:pageItem},function (res) {
                    if(res.result){
                        $scope.tasks = res.data;
                        var advices=[
                            {
                                min:0,
                                max:60,
                                mark:'较差'
                            },{
                                min:60,
                                max:70,
                                mark:'一般'
                            },{
                                min:70,
                                max:85,
                                mark:'良好'
                            },{
                                min:85,
                                max:101,
                                mark:'很好'
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
                    }
                },function () {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "获取题目失败"
                    })
                })
            };
            vm.queryFetch = function () {
                loadData(1, $scope.tasks.pageItem);
            };
            vm.selectPage = function (page, $event) {
                loadData($scope.tasks.page, $scope.tasks.pageItem);
            };
        })
        
        .controller('TeacherTaskController', function ($scope, $state, Task, Books) {
            if (!$state.params.taskId) return;
            $scope.selectedClassId = $state.params.classId;
            Task.task.get({taskId: $state.params.taskId}, function (res) {
                if (res.result) {
                    $scope.task = res.data;
                    if (!$scope.selectedClassId && $scope.task.to.length > 0) {
                        $scope.selectedClassId = $scope.task.to[0].classId;
                    }
                    if ($scope.selectedClassId && $scope.task.to.length > 0) {
                        for (var i = 0; i < $scope.task.to.length; i++) {
                            if ($scope.task.to[i].classId === $scope.selectedClassId) {
                                $scope.selectedClass = $scope.task.to[i];
                            }
                        }
                    }
                    if ($scope.task.content.topics && $scope.task.content.topics.length > 0) {
                        //get questions
                        Books.topics.query({
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
        })
        .controller('TaskCheckController', function ($scope, $state, Task, Books) {
            var vm = this;

            if (!$state.params.taskId) return;
            $scope.statistics = {};
            $scope.selectedClassId = $state.params.classId;
            Task.task.get({taskId: $state.params.taskId}, function (res) {
                if (res.result) {
                    $scope.task = res.data;
                    if (!$scope.selectedClassId && $scope.task.to.length > 0) {
                        $scope.selectedClassId = $scope.task.to[0].classId;
                    }
                    if ($scope.selectedClassId && $scope.task.to.length > 0) {
                        for (var i = 0; i < $scope.task.to.length; i++) {
                            if ($scope.task.to[i].classId === $scope.selectedClassId) {
                                $scope.selectedClass = $scope.task.to[i];
                            }
                        }
                    }
                    loadTaskTopics();
                }

            }, function (res) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "获取作业失败"
                });
            });
            var loadTaskTopics = function () {

                //get questions
                Task.taskTopic.query({taskId: $scope.task._id, classId: $scope.selectedClass.classId}, function (res) {
                    if (res.result) {
                        $scope.questions = res.data;
                        //statistics
                        var completed = 0;
                        angular.forEach($scope.questions.list, function (item) {
                            // item.statistics.submitters ==0 ，如果該題無人提交，也算批改完成
                            if ((item.statistics && item.statistics.completed) || ( item.statistics.submitters == 0)) {
                                completed++;
                            }
                        });
                        $scope.statistics = {total: $scope.questions.count, completed: completed};
                    }
                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "获取题目失败"
                    });
                });

            };
        })
        .controller('CheckQuestionController', function ($scope, $state, Task, Books) {
            var vm = this;
            $scope.chartLabels = ["正确率", "错误率"];
            $scope.chartData = [0, 0];
            $scope.selectedClassId = $state.params.classId;
            vm.init = function () {
                if (!$state.params.taskId) return;
                Task.task.get({taskId: $state.params.taskId, classId: $scope.selectedClassId}, function (res) {
                    if (res.result) {
                        $scope.task = res.data;
                        if (!$scope.selectedClassId && $scope.task.to.length > 0) {
                            $scope.selectedClassId = $scope.task.to[0].classId;
                        }
                        if ($scope.selectedClassId && $scope.task.to.length > 0) {
                            for (var i = 0; i < $scope.task.to.length; i++) {
                                if ($scope.task.to[i].classId === $scope.selectedClassId) {
                                    $scope.selectedClass = $scope.task.to[i];
                                }
                            }
                        }

                        var index = $scope.task.content.topics.indexOf($state.params.topicId);
                        if (index !== -1) {
                            $scope.task.preQuestion = $scope.task.content.topics[index - 1];
                            $scope.task.nextQuestion = $scope.task.content.topics[index + 1];
                            loadTaskTopics();
                        }

                    }

                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "获取作业失败"
                    });
                });
            };
            var loadTaskTopics = function () {

                //get questions
                Task.taskTopic.query({
                    taskId: $scope.task._id,
                    classId: $scope.selectedClass.classId,
                    topicId: $state.params.topicId
                }, function (res) {
                    if (res.result) {
                        $scope.question = res.data.list[0];
                        //statistics
                        updateChart();
                    }
                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "获取题目失败"
                    });
                });

            };
            var updateChart = function () {
                if (!$scope.question.myAnswers) return;
                var executors = $scope.task.executors;

                var right = 0, wrong = 0;
                // angular.forEach($scope.question.myAnswers,function (item) {
                //     if(item.mark==='对') right++;
                //     if(item.mark==='错') wrong++;
                // });
                for (var i = 0; i < $scope.question.myAnswers.length; i++) {
                    angular.forEach(executors, function (extors) {
                        if (extors._id == $scope.question.myAnswers[i].user._id) {
                            $scope.question.myAnswers[i].user.taskExe = extors.taskExe;
                        }

                    })
                    if ($scope.question.myAnswers[i].mark === '对') right++;
                    if ($scope.question.myAnswers[i].mark === '错') wrong++;
                }
                var total = right + wrong;
                if (total === 0) return;
                right = Math.round(right / total * 100);
                wrong = Math.round(wrong / total * 100);
                $scope.chartData = [right, wrong];
                $scope.chartLabels = ["正确率(%)", "错误率(%)"];
            };
            $scope.markQuestion = function (answer, mark) {
                if (answer.mark === mark) return;
                var oMark = answer.mark;
                answer.mark = mark;
                Books.myAnswer.save({myAnswerId: answer._id}, {mark: mark}, function (res) {
                    answer = angular.extend(answer, res.data);
                    $scope.toasty.success({
                        title: " ｡◕‿◕｡",
                        msg: "批改成功"
                    });
                    updateChart();
                }, function (res) {
                    answer.mark = oMark;
                    return $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "批改失败"
                    });
                });
            };
        })
        .controller('StudentTaskController', function ($scope, $state, $timeout ,Task, Books, FileUploader, MeanUser) {
            var vm = this;
            vm.user=MeanUser.user;
            vm.init = function () {
                if ($state.params.taskId) return getTaskByTaskId();
                if ($state.params.taskExeId) {
                    return getTaskByTaskExeId();
                } else {
                    $scope.taskExe = {};
                }
                $scope.advice = {
                    makr: '-',
                    content: '-'
                };

                
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
            var getTaskByTaskId = function () {
                Task.task.get({taskId: $state.params.taskId}, function (res) {
                    if (res.result) {
                        $scope.task = res.data;
                        if(vm.user.userType==='student'){
                            $scope.sbookId = res.data.content.bookId;
                            Books.studentBook.get({bookId:$scope.sbookId,bookType:'teacherBook'},function (res) {
                                $scope.noteToBook =res.result;
                            },function (res) {
                                $scope.sweetAlert.swal({
                                    title: '您还没有添加此内容对应的书',
                                    text: '请去添加相应书籍',
                                    timer: 2000,
                                    showConfirmButton: false
                                });
                            });
                        }

                        if ($scope.task.content.topics && $scope.task.content.topics.length > 0) {
                            //get questions
                            Books.topics.query({
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

            var getTaskByTaskExeId = function () {
                //我的作业统计
                Task.taskExe.get({taskExeId: $state.params.taskExeId}, function (res) {
                    if (res.result) {
                        $scope.taskExe = res.data;
                        $scope.task = $scope.taskExe.task;
                        $scope.allowCheck=$scope.taskExe.type==='examination'?false:true;
                        $scope.sbookId = res.data.task.content.bookId;
                        if(vm.user.userType==='student' && $scope.taskExe.type!=='examination'){
                            Books.studentBook.get({bookId:$scope.sbookId,bookType:'teacherBook'},function (res,status) {
                                $scope.statisticsToBook =res.result;
                            },function () {
                                $scope.sweetAlert.swal({
                                    title: '您还没有添加此内容对应的书',
                                    text: '请去添加相应书籍',
                                    timer: 2000,
                                    showConfirmButton: false
                                });
                            });
                        }
                        if($scope.taskExe.status.indexOf('系统批改中')!==-1){
                            $scope.waitingRecognize=true;
                            waitingRecognize();
                            return;
                        }else{
                            $scope.waitingRecognize=false;
                        }
                        if ($scope.task.content.topics && $scope.task.content.topics.length > 0) {
                            //get questions
                            if ($state.params.childrenId) {
                                Books.topics.query({
                                    topicId: 'childrenAll',
                                    childrenId:$state.params.childrenId,
                                    pageItem: $scope.task.content.topics.length
                                }, {topicIds: $scope.task.content.topics}, function (res) {
                                    if (res.result) {
                                        $scope.questions = res.data;
                                        getAdvice();
                                    }
                                }, function (res) {
                                    $scope.toasty.error({
                                        title: "╮(╯_╰)╭",
                                        msg: "获取题目失败"
                                    });
                                });
                            } else {
                                Books.topics.query({
                                    topicId: 'all',
                                    pageItem: $scope.task.content.topics.length
                                }, {topicIds: $scope.task.content.topics}, function (res) {
                                    if (res.result) {
                                        $scope.questions = res.data;
                                        getAdvice();
                                    }
                                }, function (res) {
                                    $scope.toasty.error({
                                        title: "╮(╯_╰)╭",
                                        msg: "获取题目失败"
                                    });
                                });
                            }
                        }
                    }

                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "获取作业失败"
                    });
                });
            };
            // var baseStatistics=function () {
            //     var rightNum=0,markNum=0;
            //     angular.forEach($scope.questions.list,function (item) {
            //         if(item.myAnswer){
            //             if(item.myAnswer.status==='已批改') markNum+=1;
            //             if(item.myAnswer.mark==='对') rightNum+=1;
            //         }
            //     });
            //     var rightRate=markNum?Math.round(rightNum/markNum*100):0;
            //     $scope.taskExe.baseStatistics={
            //         total:$scope.questions.count,
            //         mark:markNum,
            //         right:rightNum,
            //         rightRate:rightRate
            //     };
            // };
            var timeoutMax=40;
            var timer=null;
            var waitingRecognize=function () {
                timeoutMax--;
                if(timeoutMax>0 ){
                    timer=$timeout(getTaskByTaskExeId,10000);
                }
            };
            vm.cancelTimer=function () {
                $timeout.cancel(timer);
            }
            var saveAnswer = function (question) {
                if (!question.iAnswer && !question.iAnswerImg) return;

            };
            var submitAnswer = function (question) {
                Books.answerTopic.save({topicId: question._id}, {
                    myAnswer: question.iAnswer,
                    myAnswerImg: question.iAnswerImg,
                    teacherBookId: $scope.task.content.bookId,
                    taskId: $scope.task._id
                }, function (res) {
                    if (res.result) {
                        var data = res.data;
                        question.done = true;
                        question.answer = data.answer;
                        question.analysis = data.analysis;
                        question.status = data.status;
                        question.myAnswer = data.myAnswer;
                        // baseStatistics();
                        vm.init();
                    }


                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "回答失败"
                    });
                });
            };
            $scope.answerIt = function (question) {
                var fileItem;
                for (var i = 0; i < $scope.uploader.queue.length; i++) {
                    if (question._id === $scope.uploader.queue[i].questionId) {
                        fileItem = $scope.uploader.queue[i];
                        break;
                    }
                }
                if (fileItem) {
                    fileItem.onSuccess = function (response, status, headers) {
                        var myAnswerImg = (response && response.length > 0 ) ? response[0].url : '';
                        question.iAnswerImg = myAnswerImg;
                        submitAnswer(question);
                    };
                    $scope.uploader.uploadItem(fileItem);
                } else if (question.iAnswer) {
                    submitAnswer(question);
                }
                vm.init()
            };
            var updateChart = function () {
                if (!$scope.questions.list || !$scope.taskExe) return;
                var right = 0, wrong = 0;
                angular.forEach($scope.questions.list, function (item) {
                    if (item.myAnswer) {
                        if (item.myAnswer.mark === '对') right++;
                        if (item.myAnswer.mark === '错') wrong++;
                    }
                });
                var total = $scope.taskExe.topics.length;
                if (total === 0) return;
                right = Math.round(right / total * 100);
                if(!$scope.taskExe.statistics){
                    $scope.taskExe.statistics={};
                }
                $scope.taskExe.statistics.rightRate = right;
            };
            $scope.markQuestion = function (question, mark) {
                if(!$scope.allowCheck) return;
                if (question.myAnswer && question.myAnswer.status === '已批改') {
                    $scope.sweetAlert.swal({
                        title: '你确定重新批改么？',
                        text: '批改中有误判会导致你的学习分析不准确',
                        showCancelButton: true,
                        confirmButtonText: '确定',
                        cancelButtonText: '取消'
                    }, function (isConfirmed) {
                        if (isConfirmed) {
                            Books.myAnswer.save({myAnswerId: question.myAnswer._id}, {mark: mark}, function (res) {
                                question.myAnswer = res.data;
                                $scope.toasty.success({
                                    title: " ｡◕‿◕｡",
                                    msg: "操作成功"
                                });
                                updateChart();
                            }, function (res) {
                                // question.myAnswer.mark=oMark;
                                return $scope.toasty.success({
                                    title: "╮(╯_╰)╭",
                                    msg: "操作失败"
                                });
                            });
                        }
                    });
                }else{
                    Books.myAnswer.save({myAnswerId: question.myAnswer._id}, {mark: mark}, function (res) {
                        question.myAnswer = res.data;
                        $scope.toasty.success({
                            title: " ｡◕‿◕｡",
                            msg: "操作成功"
                        });
                        updateChart();
                    }, function (res) {
                        // question.myAnswer.mark=oMark;
                        return $scope.toasty.success({
                            title: "╮(╯_╰)╭",
                            msg: "操作失败"
                        });
                    });
                }

            };
            vm.submitTask = function () {
                if ($scope.task.myAnswer) return;
                var complete = true;
                angular.forEach($scope.questions.list, function (question) {
                    if (!question.myAnswer && !question.myAnswerImg) {
                        complete = false;
                        question.unAnswer = true;
                    }
                });
                if (!complete) {
                    return $scope.sweetAlert.swal({
                        title: '您还有题目未做完，确定要提交吗？',
                        text: '',
                        showCancelButton: true,
                        confirmButtonText: '确定',
                        cancelButtonText: '取消'
                    }, function (isConfirmed) {
                        if (isConfirmed) {
                            Task.answerTask.save({taskId: $scope.task._id}, $scope.taskExe, function (res) {
                                $scope.toasty.success({
                                    title: " ｡◕‿◕｡",
                                    msg: "提交成功"
                                });
                                $state.go('student taskExe', {taskExeId: res.data._id});
                            }, function (res) {
                                $scope.toasty.success({
                                    title: "╮(╯_╰)╭",
                                    msg: "提交失败"
                                });
                            });
                        }
                    });
                    // return $scope.toasty.success({
                    //     title:"╮(╯_╰)╭",
                    //     msg:"还有题目未完成"
                    // });
                }

                Task.answerTask.save({taskId: $scope.task._id}, $scope.taskExe, function (res) {
                    $scope.toasty.success({
                        title: " ｡◕‿◕｡",
                        msg: "提交成功"
                    });
                    $state.go('student taskExe', {taskExeId: res.data._id});
                }, function (res) {
                    $scope.toasty.success({
                        title: "╮(╯_╰)╭",
                        msg: "提交失败"
                    });
                });

            };
            vm.changeTaskExe = function (att,newParentRemark) {
                if (att === 'remark') {
                    updateTaskExe({remark: $scope.taskExe.remark});
                } else if (att === 'comment') {
                    if (!$scope.newComment) return;
                    var comment = {
                        userId: MeanUser.user._id,
                        username: MeanUser.user.username,
                        name: MeanUser.user.name,
                        type: MeanUser.user.userType,
                        comment: $scope.newComment
                    };
                    updateTaskExe({comment: comment}, function (err, res) {
                        if (err) {

                        } else {
                            $scope.taskExe.comments.push(comment);
                            $scope.newComment = '';
                        }
                    });
                }else if (att === 'parentRemark'){
                    if(!newParentRemark) return;
                    var parentRemark={
                        userId: MeanUser.user._id,
                        username: MeanUser.user.username,
                        name: MeanUser.user.name,
                        type: MeanUser.user.userType,
                        comment: newParentRemark,
                        created: Date.now()
                    };
                    updateTaskExe({comment: parentRemark},function (err) {
                        if(err){
                        } else {
                            $scope.taskExe.comments.push(parentRemark);
                            $scope.newParentRemark='';
                        }
                    });
                }
            };
            var updateTaskExe = function (content, callback) {
                Task.taskExe.update({taskExeId: $scope.taskExe._id}, content, function (res) {
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
            $scope.selectImg = function (element) {
                // //console.log(element);
            };

            $scope.uploader = new FileUploader({
                url: '/api/upload',
                headers: {'Authorization': 'Bearer ' + localStorage.getItem('JWT')},
                queueLimit: 50,
                removeAfterUpload: true
            });
            $scope.uploader.filters.push({
                name: 'imageFilter',
                fn: function (item /*{File|FileLikeObject}*/, options) {
                    var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                    type = type.toLowerCase();
                    return '|jpg|png|jpeg|bmp|gif|tif|'.indexOf(type) !== -1;
                }
            });
            $scope.uploader.onSuccessItem = function (item, res, status, header) {
                $scope.toasty.success({
                    title: " ｡◕‿◕｡",
                    msg: "上传成功"
                });
            };
            $scope.uploader.onErrorItem = function (item, res, status, header) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "上传失败"
                });
            };
        })
        .controller('TaskExeController', function ($scope, $state, Task, Books, MeanUser) {
            var vm = this;
            vm.init = function () {
                if (!$state.params.taskExeId) return;
                getTaskByTaskExeId();
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
                Task.taskExe.get({taskExeId: $state.params.taskExeId}, function (res) {
                    if (res.result) {
                        $scope.taskExe = res.data;
                        $scope.task = $scope.taskExe.task;
                        $scope.allowCheck=$scope.taskExe.type==='examination'?false:true;
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
            var updateChart = function () {
                if (!$scope.taskExe.topics) return;
                var right = 0, wrong = 0;
                angular.forEach($scope.taskExe.topics, function (item) {
                    if (item.myAnswer) {
                        if (item.myAnswer.mark === '对') right++;
                        if (item.myAnswer.mark === '错') wrong++;
                    }
                });
                var total = $scope.taskExe.topics.length;
                if (total === 0) return;
                var rightRate = Math.round(right / total * 100);
                $scope.taskExe.statistics.rightRate = rightRate;
                $scope.taskExe.statistics.mark =  parseInt(right) + parseInt(wrong);
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
                Task.taskExe.update({taskExeId: $scope.taskExe._id}, content, function (res) {
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
            $scope.markQuestion = function (question, mark) {
                if(!$scope.allowCheck) return;
                if (question.myAnswer.mark === mark) return;
                var oMark = question.myAnswer.mark;
                question.myAnswer.mark = mark;
                Books.myAnswer.save({myAnswerId: question.myAnswer._id}, {mark: mark}, function (res) {
                    question.myAnswer = res.data;
                    $scope.toasty.success({
                        title: " ｡◕‿◕｡",
                        msg: "操作成功"
                    });
                    updateChart();
                }, function (res) {
                    question.myAnswer.mark = oMark;
                    return $scope.toasty.success({
                        title: "╮(╯_╰)╭",
                        msg: "操作失败"
                    });
                })
            };
        })
        .controller('StudentUploadController', function ($scope,$state, $stateParams, Task,FileUploader,$timeout) {
            var vm = this;
            vm.init = function () {
                Task.task.get({taskId: $stateParams.taskId}, function (res) {
                    $scope.pageImgs = res.data.content.pageImgs;

            },function (res) {
                $scope.toasty.success({
                    title:"╮(╯_╰)╭",
                    msg:"数据加载失败"
                });
            });
              $scope.uploadedSuccess=false;
          };
          $scope.handleFileSelect=function(evt) {
              var element=evt.currentTarget;
              var pageImg=element.getAttribute('data-page');
              var index=getPageIndex(pageImg);
              if(index===-1) return;
              var file=element.files[0];
              $scope.pageImgs[index].file=file;
              var reader = new FileReader();
              reader.onload = function (evt) {
                  $scope.$apply(function($scope){
                      // $scope.pageImgs[index].myOriginalImg=evt.target.result;
                      $scope.pageImgs[index].myImg=evt.target.result;
                  });
              };
              reader.readAsDataURL(file);
          };
          var getPageIndex=function (pageImg) {
              for (var i=0;i<$scope.pageImgs.length;i++){
                  if($scope.pageImgs[i].pageImg===pageImg){
                      return i;
                  }
              }
              return -1;
          };
          var uploader=$scope.uploader=new FileUploader({
              url:'/api/upload',
              headers:{'Authorization':'Bearer '+localStorage.getItem('JWT')},
              queueLimit:10
          });
          uploader.filters.push({
              name: 'imageFilter',
              fn: function(item /*{File|FileLikeObject}*/, options) {
                  var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                  return '|jpg|png|jpeg|bmp|gif|tif|'.indexOf(type) !== -1;
              }
          });
          uploader.onSuccessItem = function(fileItem, response, status, headers) {
              var index=getPageIndex(fileItem.formData[1]);
              if(index===-1) return;
              $scope.pageImgs[index].url=response[0].url;
          };
          uploader.onErrorItem = function(fileItem, response, status, headers) {
              hasFailed=true;
          };
          uploader.onCompleteAll=function () {
            if(hasFailed){
                $scope.toasty.success({
                    title:"╮(╯_╰)╭",
                    msg:"上传失败，请重新上传"
                });
                return;
            }
              //
              var exeImgs=[];
              angular.forEach($scope.pageImgs,function (item) {
                  if(item.url){
                      exeImgs.push({
                          exeImg:item.url,
                          page:item.page,
                          pageImg:item.pageImg
                      })
                  }
              });
              Task.answerTask.save({taskId:$stateParams.taskId},{exeImgs:exeImgs},function (res) {
                  $scope.toasty.success({
                      title:" ｡◕‿◕｡",
                      msg:"提交成功"
                  });
                  $scope.uploadedSuccess=true;
                  $timeout(function () {
                      $state.go('student taskExe',{taskExeId:res.data._id});
                  },3000);
              },function (res) {
                  $scope.toasty.success({
                      title:"╮(╯_╰)╭",
                      msg:"提交失败"
                  });
              });
          };
          var hasFailed=false;
          vm.uploadAll=function () {
              hasFailed=false;
            angular.forEach($scope.pageImgs,function (item) {
                if(item.file && !item.url){
                    uploader.addToQueue(item.file,{formData:[item.page,item.pageImg]});
                }
            });
            if(uploader.queue.length>0){
                uploader.uploadAll();
            }

          };
      })
      .controller('StudentReport',function ($scope,$stateParams,Task) {
          var vm=this;
          $scope.isPlaying=false;
          vm.playVideo=true;
          $scope.$watch('vm.playVideo',function () {
              if(!document.getElementById('video-show')) return;
              if(vm.playVideo){
                  document.getElementById('video-show').play();
                  $scope.isPlaying=true;
              } else{
                  document.getElementById('video-show').pause();
                  $scope.isPlaying=false;
              }
          });
          vm.init=function () {
              Task.report.get({taskExeId:$stateParams.taskExeId},function (res) {
                  $scope.recommendations = res.data;

              },function (res) {
                  $scope.toasty.success({
                      title:"╮(╯_╰)╭",
                      msg:"数据加载失败"
                  });
              });
          };
      })

        .controller('TaskExamStatisticController', function ($scope, $state, Task,Examination,MeanUser) {
            var vm = this;
            $scope.user=MeanUser.user;
            $scope.selectedClassId = $state.params.classIds;
            $scope.selectedschoolId = $state.params.schoolId;
            $scope.schools = [];
            //$scope.selectedSchool=[];
            vm.init = function () {
                if (!$state.params.taskId) return;
                var tempSchoolIds = [];
                Examination.checkerTaskQuestion.get({taskId: $state.params.taskId, classIds: $scope.selectedClassId}, function (res) {
                    if (res.result) {
                        var page = 1;
                        $scope.task = res.data;
                        $scope.taskExecutors = $scope.task.executors.slice((page - 1) * 20, page * 20);
                        if ($scope.user.userType === 'unioner') {
                            angular.forEach($scope.task.to, function (item) {
                                var classInfo = {
                                    classId: item.classId,
                                    grade: item.grade,
                                    name: item.name
                                };
                                var schoolId = item.schoolId;
                                var schoolIndex = tempSchoolIds.indexOf(schoolId);
                                if (schoolIndex === -1) {
                                    tempSchoolIds.push(schoolId);
                                    var classes = [].concat(classInfo);
                                    var classIds = [].concat(classInfo.classId);
                                    $scope.schools.push(
                                        {
                                            schoolId: schoolId,
                                            schoolName: item.schoolName,
                                            classes: classes,
                                            classIds: classIds
                                        }
                                    );
                                } else {
                                    $scope.schools[schoolIndex].classes.push(classInfo);
                                    $scope.schools[schoolIndex].classIds.push(classInfo.classId);
                                }
                            });
                            if ($scope.selectedschoolId && $scope.task.to.length > 0) {
                                for (var i = 0; i < $scope.task.to.length; i++) {
                                    if ($scope.selectedschoolId === $scope.task.to[i].schoolId) {
                                        $scope.selectedSchool = $scope.task.to[i];
                                    }
                                }
                                $scope.selectedschoolId=[];
                            } else {
                                if ($scope.task.to.length === 1) {
                                    $scope.selectedSchool = {schoolName: $scope.task.to[0].schoolName};
                                } else {
                                    $scope.selectedSchool = {schoolName: '全部'};
                                }
                            }
                        }
                        if($scope.user.userType === 'schooler'){
                            var mySchool = MeanUser.user.profile.school;
                            console.log(mySchool);
                            if($scope.task.to&&mySchool){
                                var myClasses=[];
                                angular.forEach($scope.task.to,function (item) {
                                    if(mySchool.indexOf(item.schoolName)!==-1){
                                    myClasses.push(item);
                                    }
                                });
                                $scope.task.to=myClasses;
                            }
                            if ($scope.selectedClassId && $scope.task.to.length > 0) {
                                for (var i = 0; i < $scope.task.to.length; i++) {
                                    if ($scope.task.to[i].classId === $scope.selectedClassId) {
                                        $scope.selectedClass = $scope.task.to[i];
                                    }
                                }
                            } else {
                                if ($scope.task.to.length === 1) {
                                    $scope.selectedClass = {name: $scope.task.to[0].name};
                                } else {
                                    $scope.selectedClass = {name: '全部'};
                                }
                            }
                        }
                    }
                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "获取作业失败"
                    });
                });
            };
            vm.selectPage = function (page) {
                $scope.taskExecutors = $scope.task.executors.slice((page-1)*20,page*20);
            };
            vm.changeAllSelected = function () {
                $scope.task.allSelected = !$scope.task.allSelected;
                if ($scope.task.executors) {
                    angular.forEach($scope.task.executors, function (item) {
                        if (item.taskExe) {
                            item.selected = $scope.task.allSelected;
                        }
                    });
                }
            };
            $scope.sortCondition = {
                sort: '',
                reverse: false
            };
            $scope.sortGetter = function () {

            };
            vm.sortBy = function (att, reverse) {
                if (att === $scope.sortCondition.sort) {
                    $scope.sortCondition.reverse = !$scope.sortCondition.reverse;
                } else {
                    $scope.sortCondition.sort = att;
                    $scope.sortCondition.reverse = false;
                }

                att = att.split('.');
                $scope.sortGetter = function (item) {
                    var target = item;
                    angular.forEach(att, function (a) {
                        if (target) {
                            target = target[a];
                        } else {
                            target = null;
                        }
                    });
                    return target;
                };
            };

        })
        .controller('TaskExamClassStatisticController', function ($scope, $state, Task,MeanUser,Examination) {
            $scope.oneAtATime = true;
            $scope.user=MeanUser.user;
            $scope.status = {
                isCustomHeaderOpen: false,
                isFirstOpen: true,
                isFirstDisabled: false
            };
            var vm = this;
            $scope.selectedClassId = $state.params.classIds;
            $scope.selectedschoolId = $state.params.schoolId;
            $scope.schools = [];
            $scope.selectedSchool=[];
            vm.init = function () {
                if (!$state.params.taskId) return;
                var tempSchoolIds = [];
                Examination.checkerTaskQuestion.get({taskId: $state.params.taskId, classId: $scope.selectedClassId}, function (res) {
                    if (res.result) {
                        $scope.task = res.data;
                        if($scope.user.userType ==='unioner'){
                            angular.forEach($scope.task.to,function (item) {
                                var classInfo = {
                                    classId:item.classId,
                                    grade:item.grade,
                                    name:item.name
                                };
                                var schoolId = item.schoolId;
                                var schoolIndex = tempSchoolIds.indexOf(schoolId);
                                if( schoolIndex === -1 ){
                                    tempSchoolIds.push(schoolId);
                                    var classes =  [].concat(classInfo);
                                    var classIds =  [].concat(classInfo.classId);
                                    $scope.schools.push(
                                        {
                                            schoolId:schoolId,
                                            schoolName:item.schoolName,
                                            classes:classes,
                                            classIds:classIds
                                        }
                                    );
                                } else {
                                    $scope.schools[schoolIndex].classes.push(classInfo);
                                    $scope.schools[schoolIndex].classIds.push(classInfo.classId);
                                }
                            });
                            if ($scope.selectedschoolId && $scope.task.to.length > 0) {
                                for (var i = 0; i < $scope.task.to.length; i++) {
                                    if($scope.selectedschoolId ===$scope.task.to[i].schoolId){
                                        $scope.selectedSchool = $scope.task.to[i];
                                    }
                                }
                            }else {
                                if ($scope.task.to.length === 1) {
                                    $scope.selectedSchool = {schoolName: $scope.task.to[0].schoolName};
                                } else {
                                    $scope.selectedSchool = {schoolName: '全部'};
                                }
                            }
                        }
                        if($scope.user.userType === 'schooler'){
                            if ($scope.selectedClassId && $scope.task.to.length > 0) {
                                for (var i = 0; i < $scope.task.to.length; i++) {
                                    if ($scope.task.to[i].classId === $scope.selectedClassId) {
                                        $scope.selectedClass = $scope.task.to[i];
                                    }
                                }
                            } else {
                                if ($scope.task.to.length === 1) {
                                    $scope.selectedClass = {name: $scope.task.to[0].name};
                                } else {
                                    $scope.selectedClass = {name: '全部'};
                                }
                            }
                        }


                        //topic statistic
                        loadStatistics();
                        //loadKnowledgeStatistics();

                        //class statistics
                        var members = $scope.task.executors.length;
                        var submitters = 0, totalTopicLen = 0, totalRight = 0;
                        var rightRateArray = [];
                        angular.forEach($scope.task.executors, function (item) {
                            if (item.taskExe) {
                                submitters++;
                            }
                            if (item.taskExe && item.taskExe.statistics) {
                                if (item.taskExe.statistics.mark) {
                                    //totalMark+=item.taskExe.statistics.mark;
                                    totalTopicLen += item.taskExe.topics.length;
                                    totalRight += item.taskExe.statistics.right;
                                    rightRateArray.push(item.taskExe.statistics.rightRate);
                                }
                            }
                        });
                        //var averageRightRate = totalTopicLen ? Math.round(totalRight / totalTopicLen * 100) : 0;
                        $scope.statistics = {
                            members: members,
                            submitters: submitters,
                            //averageRightRate: averageRightRate
                        };
                    }

                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "加载数据失败"
                    });
                });

            };
            var loadStatistics = function () {
                if (!$state.params.taskId) return;
                Task.schoolerClassStatistic.query({
                    taskId: $state.params.taskId,
                    classIds: $scope.selectedClassId
                }, function (res) {
                    if (!res.result) return;
                    if(!res.data || !res.data.length) return;
                    var statisticsTopic = res.data.list;
                    var topics = [];
                    var sumRightAnswersLen =0;
                    var sumWrongAnswersLen =0;
                    angular.forEach($scope.task.content.topics, function (item) {
                        var topic = {
                            _id: item
                        };
                        for (var i = 0; i < statisticsTopic.length; i++) {
                            if (statisticsTopic[i]._id === item) {
                                topic = statisticsTopic[i];
                            }
                        }
                        sumRightAnswersLen += topic.rightAnswers?topic.rightAnswers.length:0;
                        sumWrongAnswersLen += topic.wrongAnswers?topic.wrongAnswers.length:0;
                        topics.push(topic);
                        $scope.questions = topics;
                        updateChart();
                    });
                    $scope.averageRightRate = Math.round((sumRightAnswersLen)/(sumRightAnswersLen + sumWrongAnswersLen)*100) || 0;

                    // 作业总评
                    getAdvice($scope.averageRightRate);
                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "加载数据失败"
                    });
                });
            };
            // var loadKnowledgeStatistics=function () {
            //     Task.taskKnowledge.get({
            //         taskId:$state.params.taskId,
            //         classIds: $scope.selectedClassId
            //     },function (res) {
            //         var points=res.data;
            //         updateChart2(points);
            //     },function (res) {
            //
            //     });
            // };
            // 作业总评(必须这样写，因为平均正确率也是计算出来的)
            var getAdvice= function(rightRate){
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

            var updateChart = function () {
                var labels = [];
                var data = [];
                var colors = [];
                angular.forEach($scope.questions, function (item, key) {
                    labels.push('题' + (key + 1));
                    var right = item.rightRate ? item.rightRate.replace('%') : 0;
                    data.push(parseInt(right));
                    colors.push('#83e3c3');
                });

                $scope.chartLabels = labels;
                $scope.chartData = data;
                $scope.chartColors = colors;
                $scope.chartOptions = {
                    scales: {
                        xAxes: [{
                            barPercentage: 0.8
                        }],
                        yAxes: [{
                            stacked: false,
                            ticks: {
                                max: 100,
                                min: 0,
                                stepSize: 20
                            }
                        }]
                    }
                };
            };
            var isParent=function (id,all) {
                for(var i=0;i<all.length;i++){
                    if(id===all[i].parent){
                        return true;
                    }
                }
                return false;
            };
            var updateChart2=function (points) {
                var labels = [];
                var data = [];
                var colors = [];
                angular.forEach(points, function (item, key) {
                    if(isParent(item._id,points)) return;
                    labels.push(item.title);
                    var right = item.rightRate ? item.rightRate: 0;
                    data.push(parseInt(right));
                    colors.push('#83e3c3');
                });

                $scope.chartLabels2 = labels;
                $scope.chartData2 = [data];
                $scope.chartColors2 = colors;
                $scope.chartSeries2=['正确率%'];
                var lineArc=$scope.chartLabels2.length>3?false:true;
                $scope.chartOptions2 = {
                    scale: {
                        type:"radialLinear",
                        lineArc:lineArc,
                        ticks: {
                            max: 100,
                            min: 0,
                            stepSize: 20
                        },
                        scaleLabel:{
                            display:true
                        }

                    },
                    legend: {
                        display: true,
                        labels: {
                            fontColor: '#83e3c3'
                        }
                    }
                };
            };
        })
        .controller('TaskExamListController',function ($scope,Task,MeanUser) {
            var vm = this;
            vm.init =function () {
                $scope.initTask=function (task) {
                    var mySchool=MeanUser.user.profile.school;
                    if(task.to && mySchool){
                        var myClasses=[];
                        angular.forEach(task.to,function (item) {
                            if(mySchool.indexOf(item.schoolName)!==-1){
                                myClasses.push(item);
                            }
                        });
                        task.mySchoolClasses=myClasses;
                    }
                };
                loadData();
            };
            var loadData = function (page,pageItem) {
                page = page || 1;
                pageItem = pageItem || 10;
               // var query = angular.extend({page: page, pageItem: pageItem}, $scope.query);
                Task.schoolerTasks.get({contentType:'examination',page:page,pageItem:pageItem},function (res) {
                    $scope.tasks =res.data;
                },function (res) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"获取作业失败"
                    });
                })
            };
            vm.selectPage = function (page, $event) {
                var pageItem = ($scope.tasks && $scope.tasks.pageItem) ? $scope.tasks.pageItem : 10;
                loadData($scope.tasks.page, pageItem);
            };
            
        })
  ;
})();
