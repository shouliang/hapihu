(function() {
    'use strict';


    angular
        .module('mean.parents')
        .factory('Parents', Parents);

    Parents.$inject = ['$resource'];

    function Parents($resource) {
        return {
            name: 'parent',
            parentContact:$resource('/api/parents/Teachers', {}, {
                update: {
                    method: 'POST'
                }
            })
        };
    }




})();
