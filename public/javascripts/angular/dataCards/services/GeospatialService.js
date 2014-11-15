(function() {
  'use strict';

  function GeospatialService() {

    function calculateBoundingBox(features) {

      var minLat = 90;
      var maxLat = -90;
      var minLng = 180;
      var maxLng = -180;

      _.forEach(features, function(datum) {

        var feature = datum.feature;

        if (feature.lat < minLat) {
          minLat = feature.lat;
        }

        if (feature.lat > maxLat) {
          maxLat = feature.lat;
        }

        if (feature.lng < minLng) {
          minLng = feature.lng;
        }

        if (feature.lng > maxLng) {
          maxLng = feature.lng;
        }

      });

      return {
        'southwest': [minLat, minLng],
        'northeast': [maxLat, maxLng]
      };

    }

    return {
      calculateBoundingBox: calculateBoundingBox
    };

  }

  angular.
    module('dataCards.services').
      factory('GeospatialService', GeospatialService);

})();
