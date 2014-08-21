(function() {
  'use strict';

  /**
   * @function guid
   * @description Creates GUID for user based on several different browser variables
   * It will never be RFC4122 compliant but it is robust
   * Original source: https://andywalpole.me/#!/blog/140739/using-javascript-create-guid-from-users-browser-information
   * @returns {Number}
   */
  function guidProvider($window) {
    var nav = $window.navigator;
    var screen = $window.screen;
    var guid = nav.mimeTypes.length;
    guid += nav.userAgent.replace(/\D+/g, '');
    guid += nav.plugins.length;
    guid += screen.height || '';
    guid += screen.width || '';
    guid += screen.pixelDepth || '';
    return guid;
  }

  angular.
    module('socrataCommon.services').
    factory('guid', guidProvider);

})();
