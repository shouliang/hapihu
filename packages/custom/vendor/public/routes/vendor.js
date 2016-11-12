(function () {
  'use strict';

  angular
    .module('mean.vendor')
    .config(vendor);

  vendor.$inject = ['$stateProvider'];

  function vendor($stateProvider) {
    $stateProvider.state('vendor', {
      url: '/vendor',
      templateUrl: 'vendor/views/index.html'
    });
  }

})();
