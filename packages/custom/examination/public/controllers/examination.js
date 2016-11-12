(function() {
    'use strict';

    /* jshint -W098 */
    angular
        .module('mean.examination')
        .controller('ExaminationController', ExaminationController);

    ExaminationController.$inject = ['$scope', 'Global', 'Examination', '$stateParams'];
    
    function ExaminationController($scope, Global, Examination, $stateParams) {
        $scope.global = Global;
        $scope.package = {
            name: 'examination'
        };
    }
    
    angular.module('mean.examination')
        .controller('TeacherExaminationListController',function ($scope,$state,Examination,MeanUser) {
            $scope.user = MeanUser.user;
            Examination.checkerTask.get({},function (res) {
                $scope.tasks = res.data.list;
            })
        })
        .controller('TeacherExaminationCheckController',function ($scope,$state,Examination) {
            var vm =this;
            if (!$state.params.taskId) return;
            $scope.taskId = $state.params.taskId;
            Examination.checkerTaskQuestion.get({taskId:$scope.taskId},function (res) {
                $scope.task = res.data;
                console.log(res.data);
                loadTaskTopics();
            }, function (res) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "获取试卷题目失败"
                });
            });
            var loadTaskTopics = function () {
                //get questions
                Examination.checkerCheckTopic.query({taskId: $scope.task._id}, function (res) {
                    if (res.result) {
                        $scope.questions = res.data;
                        //statistics
                        // var completed = 0;
                        // angular.forEach($scope.questions.list, function (item) {
                        //     // item.statistics.submitters ==0 ，如果該題無人提交，也算批改完成
                        //     if ((item.statistics && item.statistics.completed) || ( item.statistics.submitters == 0)) {
                        //         completed++;
                        //     }
                        // });
                        // $scope.statistics = {total: $scope.questions.count, completed: completed};
                    }
                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "获取试卷题目失败"
                    });
                });

            };
        })
        .controller('ExaminationCheckQstionController',function ($scope,$state,Examination,Task,Books) {
            var vm = this;
            vm.markQuestion = function (answer, mark,item,inputScore) {
                if(inputScore>$scope.question.score){
                    return $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"您输入的分值大于本题最大分值"
                    })
                }
                $scope.dynamicPopover.giveScore = item;
                // var score = mark?mark:(item?item:inputScore);
                 $scope.checkScore = item?item:inputScore;
                if($scope.checkScore>0){
                    mark = '对';
                }else {
                    mark = '错';
                }
                // if (answer.mark === mark) return;
                // var oMark = answer.mark;
                // answer.mark = mark;
                Books.myAnswer.save({myAnswerId: answer._id}, {mark: mark,score:$scope.checkScore}, function (res) {
                    answer = angular.extend(answer, res.data);
                    $scope.toasty.success({
                        title: " ｡◕‿◕｡",
                        msg: "批改成功"
                    });
                    updateChart();
                }, function (res) {
                    // answer.mark = oMark;
                    return $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "批改失败"
                    });
                });
            };

            $scope.dynamicPopover = {
                //controller:'ModalInstanceCtrl',
                templateUrl: 'myPopoverTemplate.html',
                giveScore:'',
                resolve:{
                        items:function () {
                            return vm.items;
                        }
                    }
            };
            $scope.chartLabels = ["正确率", "错误率"];
            $scope.chartData = [0, 0];
            $scope.taskId = $state.params.taskId;
            console.log($scope.topicId);
            vm.init = function () {
                if(!$scope.taskId) return;
                Examination.checkerTaskQuestion.get({taskId:$scope.taskId},function (res) {
                    if(res.result){
                        $scope.task = res.data;
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
                        msg: "获取试卷失败"
                    });
                })
            };
            var loadTaskTopics = function () {
                //get questions
                Examination.checkerCheckTopic.query({
                    taskId:$scope.taskId,
                    topicId: $state.params.topicId
                },function (res) {
                    if(res.result){
                        $scope.question = res.data.list[0];
                        if($scope.question.score>30){
                            vm.items = ['1','10','20','25'];
                        }else if($scope.question.score>20){
                            vm.items = ['1','5','10','15'];
                        }else if($scope.question.score>10){
                            vm.items = ['1','3','6','10'];
                        }else if($scope.question.score>5){
                            vm.items = ['1','2','3','4','5'];
                        }else {
                            vm.items = ['1','2','3','4'];
                        }
                        updateChart(); 
                    }
                }, function (res) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "获取试卷题目失败"
                    });
                });
            };
            var updateChart = function () {
                if (!$scope.question.myAnswers) return;
                var executors = $scope.task.executors;
                var right = 0, wrong = 0;
                for (var i = 0; i < $scope.question.myAnswers.length; i++) {
                    angular.forEach(executors, function (extors) {
                        if (extors._id == $scope.question.myAnswers[i].user._id) {
                            $scope.question.myAnswers[i].user.taskExe = extors.taskExe;
                        }
                    });
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

        })
        .controller('ExamQuestionCreateController',function ($scope,$state,System,$location,$anchorScroll,$timeout,Examination,MeanUser,$stateParams) {
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
        .controller('ExamQuestionListController',function ($scope,$state,Examination,System,$stateParams,$location,$anchorScroll,$timeout,$filter,Resources) {
         var vm = this;
            vm.init = function () {
                System.adminVariables.get({key:'grades,subjects'},function (res) {
                    var list=res.data.list;
                    angular.forEach(list,function (item) {
                        if(item.key==='grades'){
                            vm.grades=angular.fromJson(item.value);
                        }
                        if(item.key==='subjects'){
                            vm.subjects=angular.fromJson(item.value);
                        }
                    });
                },function () {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"无法获取学期数据"
                    });
                });
                loadData();
            };
            var loadData = function (page,pageItem) {
                // var page=$scope.questionsPri.page ||$scope.questionsPri.page || 1;
                // var pageItem=$scope.questionsPri.pageItem || $scope.questionsPub.page|| 20;
                // $scope.search.knowledgeIds=null;
                // if($scope.knowledgeSelected && $scope.knowledgeSelected.knowledgePoints){
                //     var knowledgePoints=[];
                //     angular.forEach($scope.knowledgeSelected.knowledgePoints,function (item) {
                //         if(item && item._id){
                //             knowledgePoints.push(item._id);
                //         }
                //     });
                //     if(knowledgePoints.length>0){
                //         $scope.search.knowledgeIds=knowledgePoints.join(',');
                //     }
                // }
                // Examination.teacherExamTopics.query($scope.search,function (res) {
                //     vm.resources=res.data;
                // },function (err) {
                // });
                Examination.teacherExamTopics.get({page:page,pageItem:pageItem,profile:'private'},function (res) {
                    $scope.questionsPri = res.data;
                    // console.log(res.data);
                },function (res) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"操作失败"
                    });
                });
                Examination.teacherExamTopics.get({page:page,pageItem:pageItem,profile:'public'},function (res) {
                    $scope.questionsPub = res.data;
                    // console.log(res.data);
                },function (res) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"操作失败"
                    });
                });
            };
            vm.selectPagePri = function () {
                var pageItem = ($scope.questionsPri&&$scope.questionsPri.pageItem)?$scope.questionsPri.pageItem:20;
                loadData($scope.questionsPri.page,pageItem);
            };
            vm.selectPagePub = function () {
                var pageItem = ($scope.questionsPub&&$scope.questionsPub.pageItem)?$scope.questionsPub.pageItem:20;
                loadData($scope.questionsPub.page,pageItem);
            };
            vm.selectQuestion = function () {
               var  questionCount=0;
                if ($scope.question.selected===true){
                    $scope.questionCount++;
                }else if($scope.question.selected===false){
                    $scope.questionCount--;
                }
            }
        })
    ;

    
})();
