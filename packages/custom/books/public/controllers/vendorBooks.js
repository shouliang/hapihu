(function () {
  'use strict';

  /* jshint -W098 */
  angular
    .module('mean.books')
    .controller('VendorBooksController', VendorBooksController);

  VendorBooksController.$inject = ['$scope','Global','$state', 'Books'];

  function VendorBooksController($scope,Global,$state, Books) {
    var vm=this;
    $scope.global = Global;
    $scope.maxSize = 5;
    vm.query={},vm.editions=[];
    vm.init = function() {
      $scope.page=$state.params.page || 1;
      Books.vendorBooks.get({bookId:'group'}, function(res) {
        if(res.result){
          vm.booksGroup=res.data;
        }
      });
      loadData();
    };
    var loadData=function (page,pageItem) {
      page=page || 1;
      pageItem= pageItem ||20;
      var query=angular.extend({page:page,pageItem:pageItem},vm.query);
      Books.vendorBooks.get(query, function(res) {
        vm.books=res.data;
      },function (err) {
        $scope.toasty.error({
          title:"╮(╯_╰)╭",
          msg:"查询失败"
        });
      });

    };
    vm.queryFetch=function () {
      var pageItem=(vm.books && vm.books.pageItem)?vm.books.pageItem:20;
      loadData(1,pageItem);
    };
    vm.selectPage=function (page,$event) {
      var pageItem=(vm.books && vm.books.pageItem)?vm.books.pageItem:20;
      loadData(vm.books.page,pageItem);
    };
  }


})();

angular.module('mean.books')
    .controller('VendorBookController',function ($scope,$state,$stateParams,$location,$anchorScroll,$timeout,$filter,Books,Resources) {
      var vm=this;
      vm.init=function () {
        $scope.editModal=true;
        Books.vendorBooks.get(vm.query, function(res) {
          vm.books=res.data;
        },function (err) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"查询失败"
          });
        });
        if($stateParams.bookId){
          Books.vendorBooks.get({bookId:$stateParams.bookId},function (res) {
            vm.book=res;
            $scope.selectedBook=vm.book._id;
            if($stateParams.catalogue!==null){
              vm.initSelected($stateParams.catalogue);
            }
          },function (error) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"数据加载失败"
            });
          });
          Books.adminEditions.get({},function (res) {
            vm.editions=res.data.list;
          });
        }
      };
      vm.alert=function () {
        $scope.sweetAlert.swal({
          title:'在系统中选择资源尚未开放',
          text:'敬请期待',
          timer:2000,
          showConfirmButton:false
        })
      };
      vm.selectedBook=function () {
        if($scope.selectedBook && $scope.selectedBook!=vm.book._id){
          $state.go("vendor book",{bookId:$scope.selectedBook});
        }
      };
      vm.selectedNode=$scope.selectedNode={};
      $scope.selectNode=function (scope) {
        $scope.selectedNode.node=scope.$modelValue;
        var nodePath=[],parents=[];
        var iscope=scope;
        while(iscope){
          nodePath.unshift(iscope.index());
          iscope=iscope.$parentNodeScope;
          if(iscope){
            parents.unshift(iscope.$modelValue);
          }
        }

        $scope.selectedNode.path=nodePath;
        $scope.selectedNode.parents=parents;
        loadData();
        //update url
        var catalogue=nodePath.join(',');
        $state.go('.',{catalogue:catalogue},{location: 'replace', notify: false});
      };
      vm.initSelected=function (path) {
        if(path===undefined) return;
        var nodePath=path.split(",");
        if(nodePath.length===0) return;
        var parents=[];
        var node=vm.book;
        for(var i=0;i<nodePath.length;i++){
          if(!node || !node.nodes) break;
          if(i>0){
            node.expanded=true;
            parents.push(node);
          }
          var idx=parseInt(nodePath[i]);
          node=node.nodes[idx];
        }
        if(node){
          $scope.selectedNode.node=node;
          $scope.selectedNode.path=nodePath;
          $scope.selectedNode.parents=parents;
          loadData();
        }
      };
      var loadData=function () {
        if($scope.selectedNode.node.topics && $scope.selectedNode.node.topics.length>0){
          Books.vendorTopics.search({topicId:"search"},{topicIds:$scope.selectedNode.node.topics},function (res) {
            if(res.result){
              $scope.questions=res.data;
            }
          },function (err) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"获取数据失败"
            });
          });
        }else {
          $scope.questions=[];
        }
        $scope.resources=[];
        loadResources();
      }
      var loadResources=function () {
        if($scope.selectedNode && $scope.selectedNode.node.resources && $scope.selectedNode.node.resources.length>0){
          Resources.vendorResource.query({resourceIds:$scope.selectedNode.node.resources},function (res) {
            if(res.result){
              $scope.resources=res.data.list;
            }
          },function (err) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"获取数据失败"
            });
          });
        }else {
          $scope.resources=[];
        }
      };
      vm.updateNode=function (cb) {
        if($scope.resources.length>0){
          var resourceIds=[];
          angular.forEach($scope.resources,function (item) {
            if(item._id){
              resourceIds.push(item._id);
            }
          });
          $scope.selectedNode.node.resources=resourceIds;
        }

        Books.vendorBook.update({bookId:vm.book._id},{path:$scope.selectedNode.path,node:$scope.selectedNode.node},function (success) {
          $scope.toasty.success({
            title:" ｡◕‿◕｡",
            msg:"保存成功"
          });
          if(cb && typeof (cb) == "function"){
            cb(null,'ok');
          }
        },function (err) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"保存失败"
          });
        });
      };

      $scope.setOrder=function () {
        $scope.showOrder=true;
        $scope.originalTapics=angular.copy($scope.selectedNode.node.topics);
      };
      $scope.saveOrder=function (valid) {
        if(valid){
          vm.updateNode(function (err,result) {

          });
        }else{
          $scope.selectedNode.node.topics=$scope.originalTapics;
        }
        $scope.questions.editModal=false;
      };
      $scope.moveUp=function (question) {
        var topics=$scope.selectedNode.node.topics;
        if(topics[0]!==question._id){
          var index=topics.indexOf(question._id);
          topics[index]=topics[index-1];
          topics[index-1]=question._id;
          $scope.questions.list.splice(index,1);
          $scope.questions.list.splice(index-1,0,question);
        }
        $timeout(function () {
          $location.hash("q_"+question._id);
          $anchorScroll();
        },200);
      };
      $scope.moveDown=function (question) {
        var topics=$scope.selectedNode.node.topics;
        if(topics[topics.length-1]!=question._id){
          var index=topics.indexOf(question._id);
          topics[index]=topics[index+1];
          topics[index+1]=question._id;
          $scope.questions.list.splice(index,1);
          $scope.questions.list.splice(index+1,0,question);
        }
        $timeout(function () {
          $location.hash("q_"+question._id);
          $anchorScroll();
        },200);

      };
      $scope.deleteQuestion=function (question) {
        $scope.sweetAlert.swal({
              title: "确定要删除么?",
              // text: "Your will not be able to recover this imaginary file!",
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#DD6B55",
              cancelButtonText:"取消",
              confirmButtonText: "确定",
              closeOnConfirm: true},
            function(isConfirm){
              if(!isConfirm) return;
              var topicId=question._id;
              var topics=$scope.selectedNode.node.topics;
              var index=topics.indexOf(topicId);
              if(index>=0){
                topics.splice(index,1);
              }
              var cb=function (err,result) {
                if(!err){
                  $scope.toasty.success("删除成功");
                  $scope.questions.list.splice($scope.questions.list.indexOf(question),1);
                  $scope.questions.count=$scope.questions.count-1;
                }else{
                  $scope.toasty.error("删除失败");
                }
              };
              vm.updateNode(cb);
            });
      };
      $scope.addAttach=function (resource) {
        $scope.resources.push(resource);
      };
      vm.resourceMoveUp=function (resource) {
        var index=$scope.resources.indexOf(resource);
        if(index){
          $scope.resources.splice(index,1);
          $scope.resources.splice(index-1,0,resource);
        }
      };
      vm.deleteResource=function (resource) {
        $scope.sweetAlert.swal({
              title:'确定要删除么？',
              text:'',
              showCancelButton:true,
              confirmButtonText:'确定',
              cancelButtonText:'取消'
            },function (isConfirmed) {
              if(isConfirmed){
                $scope.resources.splice($scope.resources.indexOf(resource),1);
              }
            }
        );
      };
      $scope.insertResource=function (resources) {
        $scope.resources.count=$scope.resources.count+resources.length;
        angular.forEach(resources,function (resource) {
          $scope.resources.push(resource);
        });
      };
      vm.saveResource=function (save) {
        if(save){
          vm.updateNode(function (err,result) {
            vm.editResource=false;
          });
        }else {
          loadResources();
          vm.editResource=false;
        }

      };
      vm.synchronize=function () {
        $scope.sweetAlert.swal({
              title:'确定把新内容到同步到用户图书？',
              text:'若只修改了题目，则无需更新',
              showCancelButton:true,
              confirmButtonText:'确定',
              cancelButtonText:'取消'
            },function (isConfirmed) {
              if(isConfirmed){
                Books.synchronize(vm.book._id).then(function (res) {
                  $scope.toasty.success({
                    title:" ｡◕‿◕｡",
                    msg:"同步成功"
                  });
                },function (res) {
                  $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"同步失败"
                  });
                });
              }
            }
        );
      };
    }).controller('VendorBookEditController',['$scope','$state','$stateParams','Books','FileUploader','System',function ($scope,$state,$stateParams,Books,FileUploader,System) {
      var vm=this;
      vm.uploader=new FileUploader({
        url:'/api/upload',
        headers:{'Authorization':'Bearer '+localStorage.getItem('JWT')},
        queueLimit:1,
        removeAfterUpload:true
      });
      vm.uploader.filters.push({
        name: 'imageFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
          return '|jpg|png|jpeg|bmp|gif|tif|'.indexOf(type) !== -1;
        }
      });
      vm.uploader.onSuccessItem =function (item,res,status,header) {
        $scope.toasty.success({
          title:" ｡◕‿◕｡",
          msg:"上传成功"
        });
        if(res && res.length>0){
          $scope.book.cover=res[0].url;
        }

      };
      vm.uploader.onErrorItem =function (item,res,status,header) {
        $scope.toasty.error({
          title:"╮(╯_╰)╭",
          msg:"上传失败"
        });
      };
      vm.init=function () {
        $scope.book = {online:'unOnline'};
        Books.adminEditions.get({},function (res) {
          vm.editions=res.data.list;
        });
        System.adminVariables.get({key:'sessions,subjects'},function (res) {
          var list=res.data.list;
          angular.forEach(list,function (item) {
            if(item.key==='sessions'){
              vm.sessions=angular.fromJson(item.value);
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
        if($state.current.name==='edit book'){
          $scope.action='edit';
          if($stateParams.bookId){
            Books.vendorBooks.get({bookId:$stateParams.bookId},function (res) {
              $scope.book=res;
            },function (error) {
              $scope.toasty.error({
                title:"╮(╯_╰)╭",
                msg:"加载失败"
              });
            });
          }
        }
      };
      vm.create = function(isValid) {
        if (isValid) {
          // $scope.book.permissions.push('test test');
          Books.vendorBooks.save($scope.book,function(response) {
            $scope.toasty.success({
              title:" ｡◕‿◕｡",
              msg:"添加新书成功"
            });
            $state.go('vendor book',{bookId:response._id});
          },function (err) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"添加失败"
            });
          });
        } else {
          $scope.submitted = true;
        }
      };
      vm.edit=function (isValid) {
        if(isValid){
          Books.vendorBooks.update($scope.book,function(response) {
            $scope.toasty.success({
              title:" ｡◕‿◕｡",
              msg:"修改成功"
            });
            $state.go('vendor book',{bookId:response._id});
          },function (err) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"修改失败"
            });
          });
        }else {
          $scope.submitted = true;
        }
        
        
      }
    }])
    .controller('VendorBookCatalogueController',['$state','$rootScope','$scope','$stateParams','$location','$anchorScroll','Books','Common',function ($state,$rootScope,$scope,$stateParams,$location,$anchorScroll,Books,Common) {
      var vm=this;
      vm.nodes=[];
      vm.init=function () {
        if($stateParams.bookId){
          Books.vendorBooks.get({bookId:$stateParams.bookId},function (res) {
            vm.book=res;
            if(res.nodes){
              vm.nodes=res.nodes;
              vm.originalNodes=angular.copy(vm.nodes);
            }
            if(vm.nodes.length===0){
              $scope.showInput=true;
            }

          },function (error) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"操作失败"
            });
          });
        }
      };
      $scope.igoBack=function () {
        var equ=angular.equals(vm.originalNodes,vm.nodes);
        if(equ){
          $rootScope.goBack();
        }else{
          $scope.sweetAlert.swal({
                title:'目录已经修改，是否要保存？',
                text:'',
                showCancelButton:true,
                confirmButtonText:'确定',
                cancelButtonText:'取消'
              },function (isConfirmed) {
                if(isConfirmed){
                  vm.saveCatalogue();
                }else{
                  $rootScope.goBack();
                }
              }

          );
        }

      };
      $scope.removeItem = function (scope) {
        $scope.sweetAlert.swal({
              title:'确定要删除么？',
              text:'',
              showCancelButton:true,
              confirmButtonText:'确定',
              cancelButtonText:'取消'
            },function (isConfirmed) {
              if(isConfirmed){
                scope.remove();
              }
            }

        );

      };

      $scope.toggle = function (scope) {
        scope.toggle();
      };

      $scope.moveLastToTheBeginning = function () {
        var a = $scope.data.pop();
        $scope.data.splice(0, 0, a);
      };

      $scope.newSubItem = function (scope) {
        var nodeData = scope.$modelValue;
        nodeData.nodes.push({
          title: '',
          nodes: [],
          topics:[],
          resources:[]
        });
      };
      vm.addRootCata=function () {
        $location.hash('inputCatalogue');
        $anchorScroll();
      };
      vm.saveCatalogue=function () {
        var book={
          _id:vm.book._id,
          nodes:vm.nodes
        };
        Books.vendorBooks.update(book,function (res) {
          $scope.toasty.success({
            title:" ｡◕‿◕｡",
            msg:"保存成功"
          });
          vm.originalNodes=angular.copy(vm.nodes);
        },function (err) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"保存失败"
          });
        });
      }
      $scope.collapseAll = function () {
        $scope.$broadcast('angular-ui-tree:collapse-all');
      };

      $scope.expandAll = function () {
        $scope.$broadcast('angular-ui-tree:expand-all');
      };
      vm.addNewCatalogue=function (scope) {
        if(!$scope.newCatalogue) return;
        var nodes=Common.parseTextToArray($scope.newCatalogue);
        var formatNode=function (node) {
          delete node.s;
          node.topics=[];
          node.resources=[];
          angular.forEach(node.nodes,function (item) {
            formatNode(item);
          });
        };
        angular.forEach(nodes,function (item) {
          formatNode(item);
        });
        angular.forEach(nodes,function (item) {
          vm.nodes.push(item);
        });
        $scope.newCatalogue='';
      };

    }])
    .controller('VendorBookImagesController',function ($scope,$stateParams,FileUploader,Books) {
      var vm=this;
      vm.init=function () {
        if(!$stateParams.bookId) return;
        Books.vendorBooks.get({bookId:$stateParams.bookId},function (res) {
          vm.book=res;
        },function (error) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"操作失败"
          });
        });
        loadData();
      };
      var loadData=function (page,pageItem) {
        page= page || 1;
        pageItem = pageItem || 20;
        Books.bookImage.get({id:$stateParams.bookId,page:page,pageItem:pageItem},function (res) {
          vm.bookImages=res.data;
        },function (error) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"获取数据失败"
          });
        });
      };
      vm.autoPage=function () {
         var firstPage=uploader.queue.length>0?parseInt(uploader.queue[0].formData[0]):0;
         if(!firstPage) {
           $scope.toasty.error({
             title:"╮(╯_╰)╭",
             msg:"请输入第一项的页面"
           });
           return;
         }
         angular.forEach(uploader.queue,function (item) {
           item.formData[0]=firstPage++;
         });

      };
      vm.selectPage=function (page,$event) {
        var pageItem=(vm.bookImages && vm.bookImages.pageItem)?vm.bookImages.pageItem:0;
        loadData(vm.bookImages.page,pageItem);
      };
      var uploader=$scope.uploader=new FileUploader({
        url:'/api/upload',
        headers:{'Authorization':'Bearer '+localStorage.getItem('JWT')},
        queueLimit:50
      });
      uploader.filters.push({
        name: 'imageFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
          return '|jpg|png|jpeg|bmp|gif|tif|'.indexOf(type) !== -1;
        }
      });
      // uploader.onSuccessItem =function (item,res,status,header) {
      //   $scope.toasty.success({
      //     title:" ｡◕‿◕｡",
      //     msg:"上传成功"
      //   });
      //   if(res && res.length>0){
      //     $scope.book.cover=res[0].url;
      //   }
      // };
      // uploader.onErrorItem =function (item,res,status,header) {
      //   $scope.toasty.error({
      //     title:"╮(╯_╰)╭",
      //     msg:"上传失败"
      //   });
      // };

      uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {

      };
      uploader.onAfterAddingFile = function(fileItem) {
        // vm.imageCount=vm.imageCount+1;
        // fileItem.formData[0]=vm.imageCount;
      };
      uploader.onAfterAddingAll = function(addedFileItems) {
      };
      uploader.onBeforeUploadItem = function(item) {
        // console.info('onBeforeUploadItem', item);
      };
      uploader.onProgressItem = function(fileItem, progress) {
        // console.info('onProgressItem', fileItem, progress);
      };
      uploader.onProgressAll = function(progress) {
      };
      uploader.onSuccessItem = function(fileItem, response, status, headers) {
        fileItem.formData[1]=response[0].url;
      };
      uploader.onErrorItem = function(fileItem, response, status, headers) {
      };
      uploader.onCancelItem = function(fileItem, response, status, headers) {
        // console.info('onCancelItem', fileItem, response, status, headers);
      };
      uploader.onCompleteItem = function(fileItem, response, status, headers) {
        // console.info('onCompleteItem', fileItem, response, status, headers);
      };
      uploader.onCompleteAll = function() {
      };
      vm.saveToBook=function () {
        if(!uploader.queue.length) return;
        var uploadList=[];
        angular.forEach(uploader.queue,function (item) {
          if(item.isSuccess ){
            uploadList.push({
              url: item.formData[1],
              pageNum:item.formData[0] || 0
            })
          }
        });
        Books.bookImageUpload.save({bookId:vm.book._id},{postImages:uploadList},function (res) {
          $scope.toasty.success({
            title:" ｡◕‿◕｡",
            msg:"保存成功"
          });
          if(res.result){
            uploader.clearQueue();
            loadData();
          }
        },function (err) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"获取数据失败"
          });
        });
      };
      vm.saveImg=function (img) {
        Books.bookImage.update({id:img._id},img,function (res) {
          $scope.toasty.success({
            title:" ｡◕‿◕｡",
            msg:"保存成功"
          });
        },function (error) {
          $scope.toasty.error({
            title:"╮(╯_╰)╭",
            msg:"保存失败"
          });
        });
      };
      vm.deleteImg=function (img) {
        $scope.sweetAlert.swal({
              title:'确定要删除么？',
              text:'',
              showCancelButton:true,
              confirmButtonText:'确定',
              cancelButtonText:'取消'
            },function (isConfirmed) {
              if(isConfirmed){
                Books.bookImage.delete({id:img._id},{},function (res) {
                  $scope.toasty.success({
                    title:" ｡◕‿◕｡",
                    msg:"删除成功"
                  });
                  vm.bookImages.list.splice(vm.bookImages.list.indexOf(img),1);
                    loadData();
                },function (error) {
                  $scope.toasty.error({
                    title:"╮(╯_╰)╭",
                    msg:"删除失败失败"
                  });
                });
              }
            }

        );

      }
      $scope.getCropResult=function (cropped,img) {
        if(cropped){
          var x1=Math.round(cropped.info.x);
          var y1=Math.round(cropped.info.y);
          var x2=Math.round(cropped.info.x+cropped.info.width);
          var y2=Math.round(cropped.info.y+cropped.info.height);
          img.mark = {
            imgData:cropped.dataUrl,
            postion:[x1,y1,x2,y2]
          };
          Books.bookImage.update({id:img._id},img,function (res) {
            $scope.toasty.success({
              title:" ｡◕‿◕｡",
              msg:"保存成功"
            });
          },function (error) {
            $scope.toasty.error({
              title:"╮(╯_╰)╭",
              msg:"保存失败"
            });
          });
        }
      };
    })
;