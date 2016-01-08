const angular = require('angular');
// The path to the squire.js source, for the iframe to reference
// NOTE: this lives in plugins/ and not bower because our js blob doesn't actually need squire.js
// in it, and squire.js has default behavior that initializes itself if it finds itself in an
// iframe, which makes the whole document contenteditable.
var SQUIRE_JS = '/javascripts/plugins/squire.js';

angular.
  module('socrataCommon.services').
  factory('SquireSource', SquireSourceProvider);


function SquireSourceProvider($http) {
  return {
    get: function() {
      return $http.get(SQUIRE_JS);
    }
  };
}
