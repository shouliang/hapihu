'use strict';

angular.module('mean.common').directive('schoolAutoInput', function(System,$http) {
    return {
        // can be in-lined or async loaded by xhr
        // or inlined as JS string (using template property)
        restrict:'A',
        template:'<span><input type="text" ng-model="selectedSchool" placeholder="学校名称" uib-typeahead="school.name for school in getSchools($viewValue)" typeahead-on-select="iselected($item, $model, $label, $event);" typeahead-loading="isLoading" typeahead-no-results="[]" typeahead-min-length="1" class="form-control"><i ng-show="isLoading" class="glyphicon glyphicon-refresh form-control-feedback" aria-hidden="true"></i></span>',
        replace: true,
        scope:{location:'=schoolLocation',selectedSchool:'=ngModel',onSchoolSelected:'&schoolSelected',selectedSchoolObject:'=ngObject'},
        link: function(scope, element, attrs) {
            scope.getSchools=function (val) {
                var query={keyword:val};
                var addressCode=[];
                var address=scope.location;
                if(address){
                    if(address.province && address.province.id){
                        // addressCode=address.province.id;
                        addressCode.push(address.province.id);
                    }
                    if(address.city && address.city.id){
                        // addressCode=address.city.id;
                        addressCode.push(address.city.id);
                    }
                    if(address.district && address.district.id){
                        // addressCode=address.district.id;
                        addressCode.push(address.district.id);
                    }
                }
                if(addressCode.length>0){
                    query.zone=addressCode;
                }
                return $http.get('/api/get-schools',{params:query}).then(function(res){
                    // console.log("search-schools res:",res.data);
                    if(res.data && res.data.result){
                        return res.data.data.list.map(function (item) {
                            return item;
                        });
                    }else{
                        return [];
                    }

                });
            };
            scope.iselected=function (item,modal,label,event) {
                // 在调用处用 school-selected="func(selectedSchool)"
                scope.selectedSchoolObject=item;
                if(scope.onSchoolSelected){
                    scope.onSchoolSelected({selectedSchool:item});
                }

            };
        }
    };
});
