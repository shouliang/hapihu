(function() {
    'use strict';

    function Schedule($http, $q) {
        return {
            name: 'schedule',
            checkCircle: function(circle) {
                var deferred = $q.defer();

                $http.get('/api/schedule/example/' + circle).success(function(response) {
                    deferred.resolve(response);
                }).error(function(response) {
                    deferred.reject(response);
                });
                return deferred.promise;

            }
        };
    }

    angular
        .module('mean.schedule')
        .factory('Schedule', Schedule);

    Schedule.$inject = ['$http', '$q'];

})();
