angular.module('dataCards.models').factory('choroplethHelpers', function($http, $log, $rootScope){
  return {
    returnDataFromGeojson: function(geojson, columnID) {
      console.log('TODO: temporary hack to implement choropleth breaks. Assumes for NOW that data for Geojson is embeddded in Geojson Properties. Will do Join in next sprint.');
      var data = _.map(geojson.features, function(feature) { return Number(feature.properties[columnID]); });
      return data;
    },
    createBoundsArray: function(geojson) {
      var minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
      if (!geojson) return [ [maxLat,maxLng],[minLat,minLng] ];
      var updateBounds = {};
      // helper functions for updating the bound variables by
      // calculating min/max coordinates of different Geometry Types
      function compareBoundValues(lats,lngs){
        if (_.min(lngs) < minLng) minLng = _.min(lngs);
        if (_.max(lngs) > maxLng) maxLng = _.max(lngs);
        if (_.min(lats) < minLat) minLat = _.min(lats);
        if (_.max(lats) > maxLat) maxLat = _.max(lats);
      }
      updateBounds.positionArray = function(positions) {
        // NOTE: in Geojson, positions are denoted as [longitude, latitude] pairs
        var lngs = _.map(positions, function(lngLat){ return lngLat[0]; });
        var lats = _.map(positions, function(lngLat){ return lngLat[1]; });
        compareBoundValues(lats,lngs);
      };
      updateBounds.Polygon = function(coordinates) {
        // Polygon coordinates = arrays of position arrays
        _.each(coordinates, function(positionArrays){
          updateBounds.positionArray(positionArrays);
        });
      };
      updateBounds.MultiPolygon = function(coordinates) {
        // MultiPolygon coordinates = an array of Polygon coordinate arrays
        _.each(coordinates, function(polygonCoordinates){
          updateBounds.Polygon(polygonCoordinates);
        });
      };
      updateBounds.MultiLineString = function(coordinates) {
        // MultiLineString coordinates
        // = an array of LineString coordinate arrays
        // = an array of arrays of position arrays
        // (same as Polygon coordinates)
        updateBounds.Polygon(coordinates);
      };
      updateBounds.LineString = function(coordinates) {
        // LineString coordinates = position array
        updateBounds.positionArray(coordinates);
      };
      updateBounds.Point = function(coordinates) {
        compareBoundValues([coordinates[1]],[coordinates[0]]);
      };
      if (geojson.type == 'FeatureCollection') {
        _.each(geojson.features, function(feature){
          var coordinates = feature.geometry.coordinates;
          updateBounds[feature.geometry.type](coordinates);
        });
        $rootScope.addTimer('Calculate ' + geojson.id + ' Bounds', geojson.filesize);
        return [ [maxLat,maxLng],[minLat,minLng] ];
      } else {
        $log.error("Geojson is not a FeatureCollection")
      }
    },
    createClassBreaks: function(options) {
      options = {
        method: options.method.toLowerCase() || 'jenks',
        data: options.data || this.returnDataFromGeojson(options.geojson)
      }
      if (options.method == 'jenks') {
        options.methodParam = options.numberOfClasses || 4;
      } else if (options.method == 'quantile') {
        options.methodParam = options.p;
      } else {
        $log.error('Invalid/non-supported class brekas method '+options.method);
      }
      var classBreaks = ss[options.method](options.data, options.methodParam);
      $rootScope.addTimer('Created class breaks');
      return classBreaks;
    },
    classBreakColors: function(classBreaks) {
      $log.error('TODO');
    }
  }
});