(function () {
    'use strict';

    /* jshint -W098 */
    angular
        .module('mean.teacher')
        .controller('UnionerController', UnionerController);

    UnionerController.$inject = ['$scope', 'Global', '$timeout', 'MeanUser', 'Task', 'Books', '$uibModal'];

    function UnionerController($scope, Global, $timeout, MeanUser, Task, Books, $uibModal) {
        var vm = this;
        $scope.test = function () {
            window.history.pushState({}, '', 'hi');
        };
        $scope.user = MeanUser.user;
        if ($scope.user.visited && $scope.user.visited.length > 1) {
            $scope.lastVisited = $scope.user.visited[$scope.user.visited.length - 2];
        }
        vm.init = function () {
            //new tasks
            Task.teacherTasks.get({page: 1, pageItem: 3}, function (res) {
                if (res.result) {
                    $scope.tasks = res.data;
                    if ($scope.tasks.list.length === 0) {
                        $scope.hasNoTasks = true;
                    }
                }
            }, function (res) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "获取作业失败"
                });
            });
            //my books
            Books.teacherBook.get({}, function (res) {
                if (res.result) {
                    $scope.books = res.data;
                    if ($scope.books.list.length === 0) {
                        $scope.hasNoBooks = true;
                    }
                }

            }, function (err) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "获取我的书失败"
                });
            });

            //new notificatoin
            vm.checkNotification();
            $scope.addPaper = function () {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'teacher/views/unioner/addPaper.html',
                    windowClass: 'theme-modal dialog-md',
                    resolve: {},
                    controller: function ($scope, $uibModalInstance) {
                        $scope.book = {};
                        $scope.ok = function () {
                            if (!$scope.book._id) {
                                return $scope.tip = '请填写试卷ID';
                            }
                            if (!$scope.book.code) {
                                return $scope.tip = '请填写验证码';
                            }
                            $scope.tip = '验证中..';
                            Books.bookOrder.get({bookId: $scope.book._id, bookCode: $scope.book.code}, function (res) {
                                if (res.result) {
                                    $scope.alert = "下载成功";
                                    $uibModalInstance.close(res.data);
                                }
                            }, function (res) {
                                if (res.status === 400 && typeof (res.data) === 'string') {
                                    $scope.alert = res.data;
                                } else {
                                    $scope.alert = "操作失败";
                                }

                            });

                        }
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss();
                        }

                    }
                }).result.then(function (result) {
                    if (result) {
                        $scope.books.list.push(result);
                        $scope.books.count = $scope.books.count + 1;
                    }
                });
            };
        }

        vm.checkNotification = function () {
            if (vm.notificationLoading) return;
            vm.notificationLoading = true;
            MeanUser.checkNotification().then(function (res) {
                $timeout(function () {
                    vm.notificationLoading = false;
                }, 2000);
            }, function () {
                $timeout(function () {
                    vm.notificationLoading = false;
                }, 2000);
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "获取新消息失败"
                });
            });
        }
        vm.clearNew = function () {
            MeanUser.readedNotification();
        };
    }
})();
angular.module('mean.teacher')
    .controller('UnionerPaperController', function ($scope, $state, $stateParams, Books, $location, MeanUser, $uibModal, Classes, Task) {
        var vm = this;
        vm.selectedNode = {};
        vm.init = function () {
            Books.teacherBook.get({}, function (res) {
                vm.books = res.data;
                var bookId = $stateParams.paperId;
                if (!bookId) {
                    bookId = localStorage.getItem('usedBookId');
                }
                if (!bookId && vm.books.list.length > 0) {
                    bookId = vm.books.list[0]._id;
                }
                if (bookId) {
                    for (var i = 0; i < vm.books.list.length; i++) {
                        if (bookId == vm.books.list[i]._id) {
                            vm.book = vm.books.list[i];
                            vm.selectedBook = vm.book._id;
                            break;
                        }
                    }
                    Books.teacherBook.get({bookId: bookId}, function (res) {
                        vm.book = res.data;
                        if ($stateParams.path !== null) {
                            vm.initSelected($stateParams.path);
                        }
                    });
                    localStorage.setItem('usedBookId', bookId);
                } else {
                    $scope.hasNoBook = true;
                }

            }, function (err) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "查询失败"
                });
            });
            //学校与班级
            $scope.schools = [];
            if (MeanUser.user.profile.school) {
                var schoolNames = MeanUser.user.profile.school.split(',');
                angular.forEach(schoolNames, function (item) {
                    if (item) {
                        Classes.schoolInfo.get({name: item}, function (res) {
                            if (res.data) {
                                $scope.schools.push(res.data);
                            }
                        }, function (res) {
                            $scope.toasty.error({
                                title: "╮(╯_╰)╭",
                                msg: "获取数据失败"
                            });
                        });
                    }
                });
            }
        };
        vm.changeBook = function () {
            if (vm.selectedBook && vm.selectedBook != vm.book._id) {
                $state.go("teacher book", {bookId: vm.selectedBook});
            }
        };
        $scope.selectNode = function (scope) {
            vm.selectedNode.node = scope.$modelValue;
            var nodePath = [], parents = [];
            var iscope = scope;
            while (iscope) {
                nodePath.unshift(iscope.index());
                iscope = iscope.$parentNodeScope;
                if (iscope) {
                    parents.unshift(iscope.$modelValue);
                }
            }

            vm.selectedNode.path = nodePath;
            vm.selectedNode.parents = parents;
            $scope.selectedNode = vm.selectedNode;
            loadData();
            //update url
            var path = nodePath.join(',');
            $state.go('.', {path: path}, {location: 'replace', notify: false});
        };
        vm.initSelected = function (path) {
            if (path === undefined) return;
            var nodePath = path.split(",");
            if (nodePath.length === 0) return;
            var parents = [];
            var node = vm.book;
            for (var i = 0; i < nodePath.length; i++) {
                if (!node || !node.nodes) break;
                if (i > 0) {
                    node.expanded = true;
                    parents.push(node);
                }
                var idx = parseInt(nodePath[i]);
                node = node.nodes[idx];
            }
            if (node) {
                vm.selectedNode.node = node;
                vm.selectedNode.path = nodePath;
                vm.selectedNode.parents = parents;
                $scope.selectedNode = vm.selectedNode;
                loadData();
            }
        };
        var loadData = function () {
            if (vm.selectedNode.node.topics) {
                Books.vendorTopics.search({topicId: "search"}, {topicIds: vm.selectedNode.node.topics}, function (res) {
                    if (res.result) {
                        $scope.questions = res.data;
                        $scope.selectedAllQ = true;
                    }
                    var tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    $scope.task = {
                        from: {
                            name: MeanUser.user.name,
                            userId: MeanUser.user._id
                        },
                        title: vm.selectedNode.node.title,
                        type: 'class',
                        aim: vm.selectedNode.node.aim,
                        endDate: tomorrow,
                    }
                    $scope.task.content = {
                        title: vm.selectedNode.node.title,
                        aim: vm.selectedNode.node.aim,
                        bookId: vm.book._id,
                        topics: vm.selectedNode.node.topics,
                        path: vm.selectedNode.path,
                        subject: vm.book.subject,
                        type: 'examination'
                    };
                }, function (err) {
                    $scope.toasty.error({
                        title: "╮(╯_╰)╭",
                        msg: "获取数据失败"
                    });
                });
            }
            $scope.resources = [];
        };
        vm.selectAllQ = function () {
            $scope.selectedAllQ = !$scope.selectedAllQ;
            if ($scope.questions && $scope.questions.list) {
                angular.forEach($scope.questions.list, function (item) {
                    item.selected = $scope.selectedAllQ;
                });
            }
        };
        vm.publish = function () {
            var msg = null;
            if (!$scope.task.title) {
                msg = "作业标题不能为空";
            }
            var selectedClasses = [];
            angular.forEach($scope.schools, function (item) {
                if (item.selectedGrade && item.selectedGrade.classes) {
                    angular.forEach(item.selectedGrade.classes, function (jtem) {
                        if (!jtem.ignore) {
                            selectedClasses.push({
                                name: jtem.name,
                                classId: jtem.classId,
                                grade: jtem.grade,
                                schoolName: item.name,
                                schoolId: item._id
                            });
                        }
                    });
                }
            });
            if (selectedClasses.length === 0) {
                msg = "请选择班级";
            }
            if (msg) {
                $scope.sweetAlert.swal({
                    title: "无法发布考试",
                    text: msg,
                    timer: 2000,
                    showConfirmButton: false
                });
                return;
            }
            $scope.task.to = selectedClasses;
            $scope.sweetAlert.swal({
                    title: '确定要发布么？',
                    text: '',
                    showCancelButton: true,
                    confirmButtonText: '确定',
                    cancelButtonText: '取消'
                }, function (isConfirmed) {
                    if (isConfirmed) {
                        Task.task.save({}, {task: $scope.task}, function (res) {
                            $scope.toasty.success({
                                title: " ｡◕‿◕｡",
                                msg: "发布成功"
                            });
                        }, function (res) {
                            $scope.alert = "发布考试失败";
                        });
                    }
                }
            );
        };
    })
    .controller('PaperSettingController', function ($scope, $stateParams, Task, Classes, Books) {
        var vm = this;
        vm.init = function () {
            $scope.newChecker = {show: false};
            Task.task.get({taskId: $stateParams.taskId}, function (res) {
                $scope.task = res.data;
                loadClasses();
                //topics

                if ($scope.task.content.topics) {
                    Books.vendorTopics.search({topicId: "search"}, {topicIds: $scope.task.content.topics}, function (res) {
                        $scope.topics = res.data.list;
                        var topicsCheck = {};
                        angular.forEach($scope.topics, function (item) {
                            topicsCheck[item._id] = true;
                        });
                        $scope.newChecker.allTopicsSelected = true;
                        $scope.newChecker.topics = topicsCheck;
                    }, function (res) {

                    });
                }

            }, function (res) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "加载任务失败"
                });
            });

        };
        var loadClasses = function () {
            //load classes
            if (!$scope.task.to || $scope.task.to.length === 0) return;
            var ids = [];
            angular.forEach($scope.task.to, function (item) {
                if (item && item.classId) {
                    ids.push(item.classId);
                }
            });
            if (ids.length === 0) return;
            ids = ids.join(',');
            Classes.klass.get({ids: ids}, function (res) {
                var classes = [];
                if (res.data && res.data.count > 0) {
                    var schools = [];
                    angular.forEach(res.data.list, function (item) {
                        if (item) {
                            var index = schools.indexOf(item.school.name);
                            if (index === -1) {
                                schools.push(item.school.name);
                                index = schools.length - 1;
                                classes[index] = {
                                    name: item.school.name,
                                    classes: []
                                }
                            }
                            classes[index].classes.push(item);

                        }
                    });
                    $scope.classes = classes;
                }
            }, function (res) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "加载班级失败"
                });
            });
        };
        $scope.allTopics = function () {
            angular.forEach($scope.newChecker.topics, function (value, key) {
                $scope.newChecker.topics[key] = $scope.newChecker.allTopicsSelected;
            });
        };
        var getTopicInf = function (topicId) {
            for (var i = 0; i < $scope.topics.length; i++) {
                if ($scope.topics[i]._id === topicId) {
                    return {
                        topicId: topicId,
                        title: $scope.topics[i].title
                    }
                }
            }
            return null;
        };
        $scope.getTopicTitle = function (topicId) {
            var info = getTopicInf(topicId);
            if (info) {
                return info.title;
            }
            return '不存在';
        };
        $scope.addChecker = function () {
            $scope.tip = '';
            if (!$scope.newChecker.username) {
                return $scope.tip = '请填写用户名';
            }

            var topics = [];
            var topicInfos = [];
            angular.forEach($scope.newChecker.topics, function (value, key) {
                if (value) {
                    topics.push(key);
                    topicInfos.push(getTopicInf(key));
                }
            });
            if (topics.length === 0) {
                return $scope.tip = '请选择题目';
            }
            var classes = [];
            angular.forEach($scope.classes, function (item) {
                if (item.classes) {
                    angular.forEach(item.classes, function (jtem) {
                        if (jtem.selected) {
                            classes.push({
                                name: jtem.name,
                                classId: jtem._id,
                                grade: jtem.grade,
                                schoolName: item.name,
                                schoolId: item._id
                            });
                        }
                    });
                }
            });
            if (classes.length === 0) {
                return $scope.tip = '请选择班级';
            }

            var content = {
                bookId: $scope.task.content.bookId,
                topics: topics,
                topicInfos: topicInfos
            }
            Task.taskChecker.save({taskId: $scope.task._id}, {
                checkerUsername: $scope.newChecker.username,
                to: classes,
                content: content
            }, function (res) {
                $scope.toasty.success({
                    title: " ｡◕‿◕｡",
                    msg: "添加成功"
                });
                $scope.newChecker.username = '';
                $scope.newChecker.show = false;
                if (!$scope.task.checkers) {
                    $scope.task.checkers = [];
                }
                $scope.task.checkers.push(res.data);
            }, function (res) {
                //error
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "添加失败"
                });
                if (res.data.data) {
                    $scope.tip = res.data.data;
                }
            })
        };
        $scope.deleteChecker = function (checker) {
            $scope.sweetAlert.swal({
                    title: '确定要删除么？',
                    text: '',
                    showCancelButton: true,
                    confirmButtonText: '确定',
                    cancelButtonText: '取消'
                }, function (isConfirmed) {
                    if (isConfirmed) {
                        Task.taskChecker.delete({taskId: $scope.task._id, userId: checker.userId}, function (res) {
                            var index = $scope.task.checkers.indexOf(checker);
                            $scope.toasty.success({
                                title: " ｡◕‿◕｡",
                                msg: "删除成功"
                            });
                            if (index !== -1) {
                                $scope.task.checkers.splice(index, 1);
                            }
                        }, function (res) {
                            $scope.alert = "删除失败";
                        });
                    }
                }
            );
        };
    })
    .controller('PaperImagesController', function ($scope, $stateParams, FileUploader, Teacher) {
        var vm = this;
        vm.init = function () {
            if (!$stateParams.taskId) {
                return;
            }
            $scope.taskId = $stateParams.taskId;
            loadData();
        };
        var loadData = function (page, pageItem) {
            page = page || 1;
            pageItem = pageItem || 20;
            Teacher.paperImages.get({taskId: $stateParams.taskId, page: page, pageItem: pageItem}, function (res) {
                vm.paperImages = res.data;
            }, function (error) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "获取数据失败"
                });
            });
        };

        vm.selectPage = function (page, $event) {
            var pageItem = (vm.paperImages && vm.paperImages.pageItem) ? vm.paperImages.pageItem : 0;
            loadData(vm.paperImages.page, pageItem);
        };

        var uploader = $scope.uploader = new FileUploader({
            url: '/api/upload',
            headers: {'Authorization': 'Bearer ' + localStorage.getItem('JWT')},
            queueLimit: 50
        });

        uploader.filters.push({
            name: 'imageFilter',
            fn: function (item /*{File|FileLikeObject}*/, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|tif|'.indexOf(type) !== -1;
            }
        });

        uploader.onWhenAddingFileFailed = function (item /*{File|FileLikeObject}*/, filter, options) {

        };
        uploader.onAfterAddingFile = function (fileItem) {
            // vm.imageCount=vm.imageCount+1;
            // fileItem.formData[0]=vm.imageCount;
        };
        uploader.onAfterAddingAll = function (addedFileItems) {
        };
        uploader.onBeforeUploadItem = function (item) {
            // console.info('onBeforeUploadItem', item);
        };
        uploader.onProgressItem = function (fileItem, progress) {
            // console.info('onProgressItem', fileItem, progress);
        };
        uploader.onProgressAll = function (progress) {
        };
        uploader.onSuccessItem = function (fileItem, response, status, headers) {
            fileItem.formData[1] = response[0].url;
        };
        uploader.onErrorItem = function (fileItem, response, status, headers) {
        };
        uploader.onCancelItem = function (fileItem, response, status, headers) {
            // console.info('onCancelItem', fileItem, response, status, headers);
        };
        uploader.onCompleteItem = function (fileItem, response, status, headers) {
            // console.info('onCompleteItem', fileItem, response, status, headers);
        };
        uploader.onCompleteAll = function () {
        };

        vm.saveToPaper = function () {
            if (!uploader.queue.length) return;
            var uploadList = [];
            angular.forEach(uploader.queue, function (item) {
                if (item.isSuccess) {
                    uploadList.push({
                        originalName: item._file.name,
                        url: item.formData[1]
                    })
                }
            });

            Teacher.paperImageUpload.save({taskId: $scope.taskId}, {postImages: uploadList}, function (res) {
                $scope.toasty.success({
                    title: " ｡◕‿◕｡",
                    msg: "保存成功"
                });
                if (res.result) {
                    uploader.clearQueue();
                    loadData();
                }
            }, function (err) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "获取数据失败"
                });
            });
        };

        vm.saveImg = function (img) {
            Teacher.paperImage.update({paperImageId: img._id}, img, function (res) {
                $scope.toasty.success({
                    title: " ｡◕‿◕｡",
                    msg: "保存成功"
                });
            }, function (error) {
                $scope.toasty.error({
                    title: "╮(╯_╰)╭",
                    msg: "保存失败"
                });
            });
        };

        vm.deleteImg = function (img) {
            $scope.sweetAlert.swal({
                    title: '确定要删除么？',
                    text: '',
                    showCancelButton: true,
                    confirmButtonText: '确定',
                    cancelButtonText: '取消'
                }, function (isConfirmed) {
                    if (isConfirmed) {
                        Teacher.paperImage.delete({paperImageId: img._id}, {}, function (res) {
                            $scope.toasty.success({
                                title: " ｡◕‿◕｡",
                                msg: "删除成功"
                            });
                            vm.paperImages.list.splice(vm.paperImages.list.indexOf(img), 1);
                            loadData();
                        }, function (error) {
                            $scope.toasty.error({
                                title: "╮(╯_╰)╭",
                                msg: "删除失败失败"
                            });
                        });
                    }
                }
            );
        }
    })
;