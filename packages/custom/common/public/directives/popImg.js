'use strict';

angular.module('mean.common').directive('popImg', function($uibModal,Classes) {
    return {
        restrict:'A',
        replace: false,
        scope:{popContent:'@',popImgs:'@'},
        controller:function () {

        },
        link: function(scope, element, attrs) {
            attrs.$addClass('canZoom');
            element.on('click',function(){
                popImg();
            });
            var popImg=function (att) {
                var modalInstance = $uibModal.open({
                    animation: true,
                    template: '<div class="popContent-box" ng-bind-html="content"></div>',
                    windowClass:'theme-modal-auto',
                    resolve: {
                        content:function () {
                            return scope.popContent;
                        },
                        imgUrls:function () { //支持多个图片，用';'分开
                            return scope.popImgs;
                        }
                    },
                    controller:function ($scope, $uibModalInstance,content,imgUrls) {
                        content=content || '';
                        if(imgUrls){
                            imgUrls=imgUrls.split(';');
                            angular.forEach(imgUrls,function (item) {
                                content=content+'<img src="'+item+'" />';
                            });
                        }
                        $scope.content=content;
                    }
                }).result.then(function (result) {

                });
            }
        }
    };
});
