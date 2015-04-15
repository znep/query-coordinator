(function() {
  'use strict';

  function DeviceService($window) {
    function isMobile() {
      return (/Mobi/).test($window.navigator.userAgent);
    }

    function isDesktop() {
      return !isMobile();
    }

    return {
      isMobile: isMobile,
      isDesktop: isDesktop
    };
  }

  angular.
    module('socrataCommon.services').
      factory('DeviceService', DeviceService);

})();
