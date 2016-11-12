'use strict';

angular.module('mean.common').directive('imobile', function($uibModal,Classes,GRADES) {
    return {
        // can be in-lined or async loaded by xhr
        // or inlined as JS string (using template property)
        require: 'ngModel',
        link: function(scope, element, attrs,ctrl) {
            var regx = /^(13|15|17|18|14)[0-9]{9}$/;
            ctrl.$validators.iMobile=function (modelValue, viewValue) {
                if (modelValue && !regx.exec(modelValue)) {
                    return false;
                }else{
                    return true;
                }
            }
        }
    };
});
