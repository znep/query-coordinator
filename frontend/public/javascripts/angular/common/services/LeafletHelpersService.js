const L = require('leaflet');

module.exports = function LeafletHelpersService($window, $log) {
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
      $window.socrata.utils.assert(bounds.isValid(), 'Bounds is not valid.');
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
        };
      }
    },

    /**
     * Method for validating an extent's point
     * A valid latitude is within [-90, 90 ] and a valid longitude is within [-180, 180]
     * https://msdn.microsoft.com/en-us/library/aa578799.aspx
     * Returns true if a point is within defined limits, returns false otherwise
     * @param {[number, number]} point - A point with a latitude and longitude
     * @returns {Boolean} if a point has an invalid value
     */
    validatePoint: function validatePoint(point) {
      if (point[0] < -90 || point[0] > 90) {
        return false;
      }
      if (point[1] < -180 || point[1] > 180) {
        return false;
      }
      return true;
    },

    /**
     * Method for validating an extent
     * @param {{southwest: [Number, Number], northeast: [Number, Number]} extent
     * Extent define the rectangular region to display on a map, it contains two objects:
     * - southwest: the lat-long values of the the lower-left limit of the defined region
     * - northeast: the lat-long of the upper-left limit of the defined region
     * @returns {Boolean} true if the extent is valid, false if the extent is invalid
     */
    validateExtent: function validateExtent(extent) {
      return this.validatePoint(extent.southwest) && this.validatePoint(extent.northeast);
    },

    /**
     * Method for returning an extent within the bounds of the world (lat: [-85, 85], long: [-180, -180])
     * @param {{southwest: [Number, Number], northeast: [Number, Number]} serverExtent extent based on query to Core
     * @param {{southwest: [Number, Number], northeast: [Number, Number]} defaultExtent extent based on feature flag value
     * @param {{southwest: [Number, Number], northeast: [Number, Number]} savedExtent extent based on user interaction with map
     * if a savedExtent exists, the function uses it
     * If a savedExtent doesn't exist, it uses a defaultExtent
     * If a defaultExtent doesn't exist or is invalid, it uses the serverExtent
     * If the select extent is outside of the bounds of the world,
     * we build a default extent with values lat: [-85, 85], long: [-180, -180]
     * @returns {{southwest: [Number, Number], northeast: [Number, Number]} extent - Validated extent
     */
    getExtent: function getExtent(serverExtent, defaultExtent, savedExtent) {
      var buildBounds = this.buildBounds;
      var extent = (function() {
        if (_.isPresent(savedExtent)) {
          return savedExtent;
        } else if (defaultExtent) {
          var defaultBounds;
          var featureBounds;
          try {
            defaultBounds = buildBounds(defaultExtent);
          } catch (error) {
            $log.warn(`Unable to build bounds from defaultExtent: ${defaultExtent}`);
            return serverExtent;
          }
          try {
            featureBounds = buildBounds(serverExtent);
          } catch (error) {
            $log.warn(`Unable to build bounds from serverExtent: ${serverExtent}`);
            return defaultExtent;
          }
          if (defaultBounds.contains(featureBounds)) {
            return serverExtent;
          } else {
            return defaultExtent;
          }
        } else {
          return serverExtent;
        }
      })();

      if ( _.isUndefined(extent) || !this.validateExtent(extent)) {
        extent = this.buildExtents(L.latLngBounds(
          L.latLng(85, -180),
          L.latLng(-85, 180)
        ));
      }
      return extent;
    }
  };
};
