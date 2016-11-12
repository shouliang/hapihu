'use strict';

angular.module('mean.books').directive('bookMenu', ['$window',function($window) {
    return {
        restrict:'EA',
        // template:'<div class="book-menu">{{menuList}}</div>',
        // replace:true,
        scope:{
            model:'=ngModel',

        },
        link:function (scope, el, attrs) {

            var parseNodes=function (node) {
                var mark='<li class="book-menu-li">'
                    +'<span class="book-menu-title" ng-click="">'+node.title+'</span>';
                if(node.nodes.length>0){
                    mark+='<ol class="book-menu-sub">';
                    angular.forEach(node.nodes,function (item) {
                        mark+=parseNodes(item);
                    });
                    mark+='</ol>';
                }
                mark+='</li>';
                return mark;
            };
            scope.$watch('model',function (m) {
                var mark='<div ui-tree class="book-menu-tree"><ol ui-tree-nodes ng-model="model" class="book-menu-root">';
                angular.forEach(m,function (item) {
                    mark+=parseNodes(item);
                });
                mark+='</ol></div>';
                el.html(mark);
            });
        }
    };
}]);
