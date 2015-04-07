(function() {
  'use strict';

  function LeafletHelpersService(Assert) {
    return {
      /**
       * Given an object specifying northeast and southwest extents, returns a valid
       * Leaflet LatLngBounds object.  Throws if a valid bounds cannot be created.
       * @param {{ southwest: [Number, Number], northeast: [Number, Number] }} featureExtent
       * @returns {LatLngBounds}
       */
      buildBounds: function buildBounds(featureExtent) {
        var southWest;
        var northEast;
        var bounds;

        southWest = L.latLng(featureExtent.southwest[0], featureExtent.southwest[1]);
        northEast = L.latLng(featureExtent.northeast[0], featureExtent.northeast[1]);
        bounds = L.latLngBounds(southWest, northEast);
        Assert(bounds.isValid());
        return bounds;
      },
      /**
       * Debug method for turning a LatLngBounds into a JSON extent object
       * @param {LatLngBounds} bounds
       * @returns {{southwest: [Number, Number], northeast: [Number, Number]}}
       */
      buildExtents: function buildExtents(bounds) {
        if (bounds.isValid()) {
          return {
            southwest: [bounds.getSouth(), bounds.getWest()],
            northeast: [bounds.getNorth(), bounds.getEast()]
          }
        }
      }
    };
  }

  angular.
    module('socrataCommon.services').
    service('LeafletHelpersService', LeafletHelpersService);
})();
