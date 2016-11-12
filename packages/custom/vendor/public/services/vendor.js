(function () {
  'use strict';

  angular
    .module('mean.vendor')
    .factory('Vendor', Vendor);

  Vendor.$inject = [];

  function Vendor() {
    return {
      name: 'vendor'
    };
  }
})();
