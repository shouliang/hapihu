(function() {
    'use strict';

    /* jshint -W098 */
    angular
        .module('mean.trainer')
        .controller('TrainerController', TrainerController);
    
    TrainerController.$inject = ['$scope', 'Global', 'Trainer', '$stateParams'];
    
    function TrainerController($scope, Global, Trainer, $stateParams) {
        $scope.global = Global;
        $scope.package = {
            name: 'trainer'
        };
    }
    
    angular.module('mean.trainer')
        .controller('TrainerIndexController',function ($scope,$state,Trainer,MeanUser,$timeout) {
            $scope.user = MeanUser.user;
            var  vm = this;
            vm.init = function () {
                Trainer.getTrainees.get({},function (res) {
                    $scope.members = res.data;
                },function () {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"获取学员信息失败"
                    });
                });
                Trainer.getTraineeKlass.get({},function (res) {
                    $scope.klasses = res.data;
                },function () {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"获取班级信息失败"
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
            };
        })
        .controller('TrainerTestListController',function ($scope,$state,Trainer,MeanUser) {
            $scope.user = MeanUser.user;
        })
        .controller('TrainerSendMessageController',function ($scope,$state,Notification,Trainer,MeanUser) {
            $scope.user = MeanUser.user;
            var vm=this;
            $scope.user = MeanUser.user;
            $scope.userId = MeanUser.user._id;
            $scope.messageFromId = $state.params.messageFromId; //来自谁的，就要发给谁。
            $scope.messageFromName = $state.params.messageFromName;
            $scope.page=1;
            vm.init=function () {
                loadData();
            };
            var loadData = function (page,pageItem) {
                if($state.params.messageFromId){
                    // var page = $scope.msgs.page||1;
                    // var pageItem = $scope.msgs.pageItem||20;
                    Notification.msgList.get({to:$scope.messageFromId,page:page,pageItem:pageItem},function (res) {
                        if(res.result){
                            $scope.msgs=res.data;
                        }
                    },function (res) {
                        $scope.toasty.error({
                            title:"╮(╯_╰)╭",
                            msg:"操作失败"
                        });
                    });
                    Notification.getUserById.get({userId:$scope.messageFromId},function (res) {
                        if (res.result){
                            $scope.messageFrom = res.data;
                        }
                    })
                }
            };
            vm.selectPage=function (page,$event) {
                var pageItem=($scope.msgs && $scope.msgs.pageItem)?$scope.msgs.pageItem:20;
                loadData($scope.msgs.page,pageItem);
            };
            $scope.sendMsg = function (content) {
                Notification.sendMsg.update({to:$scope.messageFromId,content:content},function (res) { //来自谁的，就要发给谁。
                    if(res.result){
                        $scope.toasty.success({
                            title: " ｡◕‿◕｡",
                            msg: "发送成功"
                        });
                        vm.init();
                        $scope.content='';
                    }
                },function () {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"操作失败"
                    })
                })
            }
        })
        .controller('CharacterExeController',function ($scope,$state,Trainer,MeanUser) {
            $scope.user = MeanUser.user;
            var vm = this;
            vm.init = function () {
                $scope.questions = {
                    count:10,
                    list:[
                        {
                            type:'选择题',
                            knowledge:['知识点1','知识点1','知识点1'],
                            stem:'请写出双曲线的渐近线'

                        },{
                            type:'选择题',
                            knowledge:['知识点1','知识点1','知识点1'],
                            stem:'请写出双曲线的渐近线'
                        },{
                            type:'选择题',
                            knowledge:['知识点1','知识点1','知识点1'],
                            stem:'请写出双曲线的渐近线'
                        }
                    ]
                }
            }
        })
        .controller('TrainerKlassDetailController',function ($scope,$state,Trainer,MeanUser) {
            $scope.user = MeanUser.user;
            $scope.klassId = $state.params.klassId;
            var vm = this;
            vm.init = function () {
                Trainer.getTraineeKlass.get({},function (res) {
                    $scope.Klasses = res.data.list;
                    angular.forEach($scope.Klasses,function (item) {
                        if($scope.klassId===item._id){
                            $scope.trainees = item;
                            console.log(item);
                        }
                    })
                },function () {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"获取班级信息失败"
                    });
                });
            };
        })
        .controller('TrainerStatisticController',function ($scope,$state,Trainer,MeanUser) {
            $scope.user = MeanUser.user;
            $scope.tasks = {
                count:10,
                list:[
                    {
                        status:'待批改',
                        title:'题目1',
                        created:'2016-11-11',
                        submitTime:'2016-02-01',
                        rightRate:30
                    },{
                        status:'已批改',
                        title:'题目2',
                        created:'2016-11-11',
                        submitTime:'2016-02-01',
                        rightRate:40
                    },{
                        status:'已批改',
                        title:'题目3',
                        created:'2016-11-11',
                        submitTime:'2016-02-01',
                        rightRate:60
                    },{
                        status:'已批改',
                        title:'题目4',
                        created:'2016-11-11',
                        submitTime:'2016-02-01',
                        rightRate:60
                    }
                ]
            }
        })
        .controller('TrainerKlassController',function ($scope,$state,Trainer,MeanUser) {
            $scope.user = MeanUser.user;
            var vm = this;
            $scope.grades = ['四年级','五年级','六年级','七年级','八年级','九年级'];
            $scope.stationes = ['已结束','正在进行'];
            $scope.query = {grade:'',station:''};
            vm.init = function () {
                loadData();
            };
            var loadData = function (grade,station) {
                $scope.query.grade=grade?grade:$scope.query.grade;
                $scope.query.station=station?station:$scope.query.station;
                Trainer.getTraineeKlass.get($scope.query,function (res) {
                    $scope.Klasses = res.data;
                },function () {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"获取班级信息失败"
                    });
                });
            };
            $scope.myFilter=function(item){
                 if(!$scope.query.station && !$scope.query.grade) return true;
                return $scope.query.station===item.station || $scope.query.grade===item.grade ;
            };
        })
        .controller('TrainerStudentController',function ($scope,$state,Trainer,MeanUser) {
            $scope.grades = ['四年级','五年级','六年级','七年级','八年级','九年级'];
            $scope.stationes = ['已教过','正在教'];
            $scope.query = {grade:'',station:''};
            var vm = this;
            vm.init = function () {
                Trainer.getTrainees.get({isPrivate:true},function (res) {
                    $scope.members = res.data;
                },function () {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"获取学员信息失败"
                    });
                });
            };
            // $scope.myFilter=function(item){
            //     if(!$scope.query.station && !$scope.query.grade) return true;
            //     return $scope.query.station===item.station && $scope.query.grade===item.grade ;
            // };
        })
        .controller('TerUploadController', function ($scope,$state, $stateParams, Trainer,FileUploader,$timeout) {
            var vm = this;
            vm.init = function () {
                Trainer.task.get({taskId: $stateParams.taskId}, function (res) {
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
                Trainer.answerTask.save({taskId:$stateParams.taskId},{exeImgs:exeImgs},function (res) {
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
        .controller('TrainerTaskExeController',function ($scope,$state,Trainer,$timeout ,MeanUser,Task) {
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
                Trainer.taskExe.get({taskExeId: $state.params.taskExeId}, function (res) {
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
                Trainer.taskExe.update({taskExeId: $scope.taskExe._id}, content, function (res) {
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
                Trainer.myAnswer.save({myAnswerId: question.myAnswer._id}, {mark: mark}, function (res) {
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
        .controller('trainerTasksController',function ($scope,$state,Trainer,MeanUser,$stateParams) {
            var vm = this;
            $scope.user = MeanUser.user;
            vm.init = function () {
                $scope.query ={};
                loadData();
            };
            var loadData = function (page, pageItem, subject) {
                page = page || 1;
                var query = angular.extend({page: page, pageItem: pageItem,userId:$stateParams.userId}, $scope.query);
                Trainer.TeeTasks.get(query, function (res) {
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
                var pageItem = ($scope.tasks && $scope.tasks.pageItem) ? $scope.tasks.pageItem : 20;
                loadData(1, pageItem);
            };
            vm.selectPage = function (page, $event) {
                var pageItem = ($scope.tasks && $scope.tasks.pageItem) ? $scope.tasks.pageItem : 20;
                loadData($scope.tasks.page, pageItem);
            };
            // $scope.selectStatus = function (subject) {
            //     $scope.selectedSubject = subject;
            //     var pageItem = ($scope.tasks && $scope.tasks.pageItem) ? $scope.tasks.pageItem : 2;
            //     loadData(1, pageItem, subject);
            // }
        })
        .controller('trainerNotebookController',function ($scope,$state,Trainer,MeanUser,$stateParams) {
            var  vm = this;
            $scope.user=MeanUser.user;
            $scope.page=1;
            vm.init=function(){
                $scope.questions ={};
                loadData();
            };
            var loadData=function (page,pageItem) {
                var page=$scope.questions.page || 1;
                var pageItem=$scope.questions.pageItem || 20;
                Trainer.TerCollectionNotebook.get({page:page,pageItem:pageItem,userId:$stateParams.userId},function(res){
                    if(res.result){
                        $scope.questions = res.data;
                    }
                },function (res) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"操作失败"
                    });
                })
            };
            vm.selectPage=function (page,$event) {
                var pageItem=($scope.questions && $scope.questions.pageItem)?$scope.questions.pageItem:20;
                loadData($scope.questions.page,pageItem);
            };


        })

        .controller('TrainerExamQstCreateController',function ($scope,$state,System,$location,$anchorScroll,$timeout,Examination,MeanUser,$stateParams) {
            $scope.user = MeanUser.user;
            var vm=this;
            vm.goBack=function () {
                window.history.back();
            };
            vm.init=function () {
                $scope.question={};
                vm.questionAnswers={
                    A:false,
                    B:false,
                    C:false,
                    D:false,
                    E:false,
                    F:false,
                    G:false
                };
                if($stateParams.topicId){
                    Examination.teacherExamTopics.get({topicId:$stateParams.topicId},function (res) {
                        $scope.question=res;
                        if($scope.question.knowledge){
                            var knowledgeTitles='';
                            angular.forEach($scope.question.knowledge,function (item) {
                                knowledgeTitles+=item.title+' ';
                            });
                            $scope.question.knowledgeTitles=knowledgeTitles;
                        }
                        if(($scope.question.type==='选择题' || $scope.question.type==='多选题')  && $scope.question.answer){
                            vm.answerClick=true;
                            angular.forEach(vm.questionAnswers,function (item,key) {
                                if($scope.question.answer.indexOf(key)>-1){
                                    vm.questionAnswers[key]=true;
                                }
                            });
                        }
                        //vm.loadBookPage();
                    },function (err) {
                        $scope.toasty.error({
                            title:"╮(╯_╰)╭",
                            msg:"数据加载失败"
                        });
                    });
                }
                if(!vm.subjects){
                    System.adminVariables.get({key:'qtypes,subjects'},function (res) {
                        var list=res.data.list;
                        angular.forEach(list,function (item) {
                            if(item.key==='qtypes'){
                                vm.qtypes=angular.fromJson(item.value);
                            }
                            if(item.key==='subjects'){
                                vm.subjects=angular.fromJson(item.value);
                            }
                        });
                    },function () {
                        $scope.toasty.error({
                            title:"╮(╯_╰)╭",
                            msg:"无法获取数据"
                        });
                    });

                    //init angular-text
                    $timeout(function () {
                        addPastedImgFun();
                    },1000);
                }
            };
            vm.changeQtype=function () {
                if($scope.question.type==='选择题'|| $scope.question.type==='多选题'){
                    vm.answerClick=true;
                }
            };
            vm.create = function() {
                var isValid=true;
                $scope.question.profile = 'private';
                if (isValid) {
                    if($scope.question.type==='选择题' || $scope.question.type==='多选题'){
                        $scope.question.answer='';
                        angular.forEach(vm.questionAnswers,function (item,key) {
                            if(item){
                                $scope.question.answer=$scope.question.answer+key;
                            }
                        });
                    }
                    Examination.teacherExamTopics.save($scope.question,function(response) {
                        $scope.toasty.success({
                            title:" ｡◕‿◕｡",
                            msg:"新建成功，请新建下一题"
                        });
                        //初始化新题目
                        delete $scope.question._id;
                        if($scope.question.image){
                            $scope.question.image.stem=[];
                            $scope.question.image.answerBlock=[];
                        }
                        delete $scope.question.stem;
                        delete $scope.question.answer;
                        delete $scope.question.analysis;
                        delete $scope.question.summary;
                        angular.forEach(vm.questionAnswers,function (item,key) {
                            vm.questionAnswers[key]=false;
                        });
                        $location.hash("main-body");
                        $anchorScroll();

                    },function (err) {
                        $scope.toasty.error({
                            title:"╮(╯_╰)╭",
                            msg:"新建失败"
                        });
                    });
                } else {
                    $scope.submitted = true;
                }
            };
            vm.edit=function (next) {
                if($scope.question.type==='选择题' || $scope.question.type==='多选题'){
                    $scope.question.answer='';
                    angular.forEach(vm.questionAnswers,function (item,key) {
                        if(item){
                            $scope.question.answer=$scope.question.answer+key;
                        }
                    });
                }
                Examination.teacherExamTopics.update($scope.question,function(response) {
                    $scope.toasty.success({
                        title:" ｡◕‿◕｡",
                        msg:"修改成功"
                    });
                    if($scope.question.from){
                        var cat=$scope.question.from.path?$scope.question.from.path.join(","):null;
                        if(next && $scope.question.from.path && $scope.question.from.path.length>0){
                            //修改下一题
                            Books.vendorBooks.get({bookId:$scope.question.from.bookId},function (res) {
                                if(res){
                                    var path=$scope.question.from.path;
                                    var node=res;
                                    for(var i=0;i<$scope.question.from.path.length;i++){
                                        if(node){
                                            node=node.nodes[$scope.question.from.path[i]];
                                        }else{
                                            break;
                                        }
                                    }
                                    if(node.topics){
                                        var index=node.topics.indexOf($scope.question._id);
                                        if(index!==-1 && node.topics[index+1]){
                                            return $state.go('edit question',{topicId:node.topics[index+1]});
                                        }
                                    }
                                    $state.go('vendor book',{bookId:$scope.question.from.bookId,catalogue:cat});
                                }
                            },function (error) {
                                $scope.toasty.error({
                                    title:"╮(╯_╰)╭",
                                    msg:"数据加载失败"
                                });
                            });
                        }else{
                            $state.go('vendor book',{bookId:$scope.question.from.bookId,catalogue:cat});
                        }

                    }else{
                        history.back();
                    }

                },function (err) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"修改失败"
                    });
                });
            };
            // vm.loadBookPage=function () {
            //     if(!$scope.question.from.page) return;
            //     if(!$scope.question.image || !$scope.question.image.page){
            //         $scope.question.image={};
            //     }
            //     $scope.question.image.page=$scope.question.from.page;
            //     Books.bookImage.get({id:$scope.question.from.bookId,pageNum:$scope.question.from.page},function (res) {
            //         if(!res.result || res.data.count===0){
            //             $scope.toasty.error({
            //                 title:"╮(╯_╰)╭",
            //                 msg:"没有找到对应图片"
            //             });
            //             return;
            //         }
            //         $scope.question.image.pageImg=res.data.list[0].url;
            //         vm.showCropBtn=true;
            //         var img=new Image();
            //         img.src=$scope.question.image.pageImg;
            //         img.onload=function () {
            //             $scope.dataUrl=getBase64Image(img);
            //         };
            //         img.onerror=function () {
            //             $scope.toasty.error({
            //                 title:"╮(╯_╰)╭",
            //                 msg:"图片加载失败"
            //             });
            //         };
            //     },function (err) {
            //         $scope.toasty.error({
            //             title:"╮(╯_╰)╭",
            //             msg:"没有找到对应图片"
            //         });
            //     });
            // };
            var getBase64Image= function(img) {
                var canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, img.width, img.height);
                var dataURL = canvas.toDataURL("image/png");
                ctx=undefined;
                return dataURL // return dataURL.replace("data:image/png;base64,", "");
            };
            $scope.getStemCrop=function (cropped) {
                if(!cropped) return;
                var stemImg=cropped.dataUrl;
                var x1=Math.round(cropped.info.x);
                var y1=Math.round(cropped.info.y);
                var x2=Math.round(cropped.info.x+cropped.info.width);
                var y2=Math.round(cropped.info.y+cropped.info.height);
                var stemPosition=[x1,y1,x2,y2];
                if(!$scope.question.image.stem){
                    $scope.question.image.stem= [];
                }
                $scope.question.image.stem.push({
                    dataUrl:stemImg,
                    position:stemPosition,
                    page:$scope.question.image.page,
                    pageImg:$scope.question.image.pageImg
                });
            };
            $scope.getAnswerBlockCrop=function (cropped) {
                if(!cropped) return;
                var answerBlockImg=cropped.dataUrl;
                var x1=Math.round(cropped.info.x);
                var y1=Math.round(cropped.info.y);
                var x2=Math.round(cropped.info.x+cropped.info.width);
                var y2=Math.round(cropped.info.y+cropped.info.height);
                var answerBlockPosition=[x1,y1,x2,y2];
                if(!$scope.question.image.answerBlock){
                    $scope.question.image.answerBlock= [];
                }
                $scope.question.image.answerBlock.push({
                    dataUrl:answerBlockImg,
                    position:answerBlockPosition,
                    page:$scope.question.image.page,
                    pageImg:$scope.question.image.pageImg
                });
            };
            vm.removeCrop=function (img,arr) {
                var index=arr.indexOf(img);
                arr.splice(index,1);
            };
            $scope.changeKnowledge=function (knowledge) {
                var knowledgeTitles='';
                angular.forEach(knowledge.knowledgePoints,function (item) {
                    knowledgeTitles+=item.title+" ";
                });
                $scope.question.knowledgeTitles=knowledgeTitles;
            };

            var addPastedImgFun=function () {
                // console.log('$element',$element);
                $('.rich-text .form-control .ng-valid').on('paste',function (ev) {
                    var clipboardData = ev.originalEvent.clipboardData;
                    if (clipboardData && clipboardData.items) {
                        var ref1 = clipboardData.items;
                        for (var j = 0 ; j < ref1.length; j++) {
                            var item = ref1[j];
                            if (item.type.match(/^image\//)) {
                                var reader = new FileReader();
                                reader.onload = function (event) {
                                    var dataUrl=event.target.result;
                                    $(ev.target).after('<img src="'+dataUrl+'">');
                                };
                                reader.readAsDataURL(item.getAsFile());
                            }
                        }
                    }
                });
            };
        })
        

    


})();
