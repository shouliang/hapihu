(function () {
  'use strict';

  /* jshint -W098 */
  angular
    .module('mean.books')
    .controller('QuestionsController', QuestionsController);

  QuestionsController.$inject = ['$scope', 'Global', 'Books'];

  function QuestionsController($scope, Global, Books) {
    $scope.global = Global;
    $scope.package = {
      name: 'books'
    };
  }
})();
angular.module('mean.books')
    .controller('QuestionCreateController',function ($scope,$state,$stateParams,$timeout,$location,$timeout,$anchorScroll,Books,FileUploader,System,$uibModal,textAngularManager) {
        var vm=this;
        vm.goBack=function () {
            if($scope.question.from && $scope.question.from.bookId){
                $state.go('vendor book',{bookId:$stateParams.bookId,catalogue:$stateParams.path});
            }else{
                window.history.back();
            }
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
                Books.vendorTopics.get({topicId:$stateParams.topicId},function (res) {
                    $scope.question=res;
                    if($scope.question.from){
                        $stateParams.bookId=$scope.question.from.bookId;
                        $stateParams.path=$scope.question.from.path?$scope.question.from.path.join(","):null;
                    }

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
                    vm.loadBookPage();
                },function (err) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"数据加载失败"
                    });
                });
            }else if($stateParams.bookId){
                Books.vendorBooks.get({bookId:$stateParams.bookId},function (res) {
                    if(res){
                        var path=$stateParams.path?$stateParams.path.split(','):[];
                        $scope.question={
                            online:"online",
                            subject:res.subject,
                            from:{
                                bookId:res._id,
                                bookName:res.name,
                                path:path
                            },
                            image:{}
                        };
                    }
                },function (error) {
                    $scope.toasty.error({
                        title:"╮(╯_╰)╭",
                        msg:"数据加载失败"
                    });
                });
            }else{
                $scope.question={online:"online"};
            }

            if(!vm.subjects){
                System.adminVariables.get({key:'qtypes,subjects'},function (res) {
                    var list=res.data.list;
                    angular.forEach(list,function (item) {
                        if(item.key==='qtypes'){
                            vm.qtypes=angular.fromJson(item.value);//获得题目类型：选择题，解答题
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
        // if(!$scope.question){
        //   isValid=false;
        // }
        if (isValid) {
          if($scope.question.type==='选择题' || $scope.question.type==='多选题'){
              $scope.question.answer='';
              angular.forEach(vm.questionAnswers,function (item,key) {
                  if(item){
                      $scope.question.answer=$scope.question.answer+key;
                  }
              });
          }
          Books.vendorTopics.save($scope.question,function(response) {
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
        Books.vendorTopics.update($scope.question,function(response) {
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
      vm.loadBookPage=function () {
        if(!$scope.question.from.page) return;
          if(!$scope.question.image || !$scope.question.image.page){
              $scope.question.image={};
          }
        $scope.question.image.page=$scope.question.from.page;
        Books.bookImage.get({id:$scope.question.from.bookId,pageNum:$scope.question.from.page},function (res) {
            if(!res.result || res.data.count===0){
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"没有找到对应图片"
                });
                return;
            }
            $scope.question.image.pageImg=res.data.list[0].url;
            vm.showCropBtn=true;
            var img=new Image();
            img.src=$scope.question.image.pageImg;
            img.onload=function () {
                $scope.dataUrl=getBase64Image(img);
            };
            img.onerror=function () {
                $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"图片加载失败"
                });
            };
        },function (err) {
            $scope.toasty.error({
                title:"╮(╯_╰)╭",
                msg:"没有找到对应图片"
            });
        });
      };
        var getBase64Image= function(img) {
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, img.width, img.height);
            var dataURL = canvas.toDataURL("image/png");
            ctx=undefined;
            return dataURL // return dataURL.replace("data:image/png;base64,", "");
        }
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
        }
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
        }
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
    });