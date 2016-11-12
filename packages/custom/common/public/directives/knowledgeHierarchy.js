'use strict';
/**
 * show particles effect
 */
angular.module('mean.common').directive('knowledgeHierarchy', function() {
    return {
        // can be in-lined or async loaded by xhr
        // or inlined as JS string (using template property)
        restrict:'EA',
        template: '<div class="knowledge-point">'
                    +'<span class="v-style-block" ng-repeat="point in hierarchyPoints" uib-popover-html="point.parentText" popover-trigger="mouseenter">{{point.point.title}}</span>'
                +'</div>',
        replace: true,
        scope:{knowledgePoints:'='},
        link: function(scope, element, attrs) {
            var hierarchy=function (points) {
                var parents=[];
                var hierarchyPoints=[];
                angular.forEach(points,function (item) {
                    if(hasSon(item,points)===null){
                        hierarchyPoints.push({point:item});
                    }
                });
                angular.forEach(hierarchyPoints,function (item) {
                   var parents=[];
                    var parentText='';
                    getParents(item.point,points,parents);
                    if(parents.length>0){
                        for(var i=parents.length-1;i>=0;i--){
                            parentText=parentText+'<span class="v-style-block">'+parents[i].title+'</span>';
                        }
                    }
                    item.parents= parents;
                    item.parentText=parentText;
                });
                scope.hierarchyPoints=hierarchyPoints;
            };
            var hasSon=function (item,points) {
                for(var i=0;i<points.length;i++){
                    if(points[i].parent===item._id){
                        return points[i];
                    }
                }
                return null;
            };
            var getParents=function (item,points,parents) {
                for(var i=0;i<points.length;i++){
                    if(points[i]._id===item.parent){
                        parents.push(points[i]);
                        return getParents(points[i],points,parents);
                    }
                }
                return null;
            };
            if(scope.knowledgePoints && angular.isArray(scope.knowledgePoints) && scope.knowledgePoints.length>0){
                hierarchy(scope.knowledgePoints);
            }
        }
    };
});
