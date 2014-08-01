angular.module('dataCards.models').factory('ChoroplethHelpers', function($log){
  return {
    getGeojsonValues: function(geojson, attr) {
      var data = [];
      _.each(geojson.features, function(feature){
        if (!feature || !feature.properties) return [];
        var val = feature.properties[attr];
        if (!val) {
          return;
        } else {
          data.push(feature.properties[attr]);
        }
      });
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
        return [ [maxLat,maxLng],[minLat,minLng] ];
      } else {
        $log.error("Geojson is not a FeatureCollection")
      }
    },
    createClassBreaks: function(options) {
      var classBreaks;
      options.method = options.method.toLowerCase() || 'jenks';
      switch(options.method) {
        case 'jenks':
          options.methodParam = options.numberOfClasses || 4;
          classBreaks = ss['jenks'](options.data, options.methodParam);
          break;
        case 'quantile':
          options.methodParam = options.p;
          classBreaks = ss['quantile'](options.data, options.methodParam);
        case 'niceequalinterval':
          var minVal = _.min(options.data),
              maxVal = _.max(options.data);
          classBreaks = d3.scale.linear().domain([minVal, maxVal]).nice().ticks(_.min([options.numberOfClasses, 4]));
          // include min and max back into d3 scale, if #nice truncates them
          if (_.min(classBreaks) > minVal) classBreaks.unshift(minVal);
          if (_.max(classBreaks) < maxVal) classBreaks.push(maxVal);
          break;
        default:
          $log.error('Invalid/non-supported class breaks method '+options.method);
      }
      return classBreaks;
    },
    classBreakColors: function(classBreaks) {
      $log.error('TODO');
    }
  }
});
