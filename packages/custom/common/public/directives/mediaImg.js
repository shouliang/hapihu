'use strict';

angular.module('mean.common').directive('mediaImg', function($uibModal,Classes,GRADES) {
    return {
        // can be in-lined or async loaded by xhr
        // or inlined as JS string (using template property)
        restrict:'A',
        replace: false,
        scope:{ngUrl:'='},
        link: function(scope, element, attrs) {
            scope.$watch('ngUrl',function () {
                if(scope.ngUrl){
                    var postfix= scope.ngUrl.split('.');
                    if(postfix.length>1){
                        postfix=postfix[postfix.length-1];
                    }else{
                        postfix=null;
                    }
                    var img='theme/assets/img/icons/icon-resource.png';
                    switch (postfix){
                        case 'mp4':
                        case 'mov':
                            img='theme/assets/img/icons/icon-resource-mp4.png';
                            break;
                        case 'zip':
                        case 'rar':
                            img='theme/assets/img/icons/icon-resource-zip.png';
                            break;
                        case 'doc':
                        case 'docx':
                            img='theme/assets/img/icons/icon-resource-doc.png';
                            break;
                        case 'ppt':
                        case 'pptx':
                            img='theme/assets/img/icons/icon-resource-ppt.png';
                            break;
                        case 'txt':
                            img='theme/assets/img/icons/icon-resource-txt.png';
                            break;
                        case 'jpg':
                        case 'jpeg':
                        case 'png':
                        case 'gif':
                            img='theme/assets/img/icons/icon-resource-jpg.png';
                            break;
                        default:

                    }
                    element.attr('src',img);
                }

            });
        }
    };
});
