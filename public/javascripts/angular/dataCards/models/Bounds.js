angular.module('dataCards.models').factory('Bounds', function($http, $rootScope){

  var minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;

  var Bounds = function(geojson) {
    // bound variables

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

    updateBounds.Polygon = function(coordinates) {

      _.each(coordinates, function(lngLats){
        // In Geojson, coordinates are denoted as [longitude, latitude] pairs
            var lngs = _.map(lngLats, function(lngLat){ return lngLat[0]; });
            var lats = _.map(lngLats, function(lngLat){ return lngLat[1]; });
            compareBoundValues(lats,lngs);
          });
    };

    updateBounds.MultiPolygon = function(coordinates) {
      _.each(coordinates, function(polygonCoordinates){
        updateBounds.Polygon(polygonCoordinates);
      });
    }

    updateBounds.MultiLineString = function(coordinates) {
      // same as Polygon
      updateBounds.Polygon(coordinates);
    }

    updateBounds.LineString = function(coordinates) {
      throw new Error("Unsupported geometry type: LineString. TODO");
    }

    updateBounds.Point = function(coordinates) {
      compareBoundValues([coordinates[1]],[coordinates[0]]);
    }

    if (geojson.type == 'FeatureCollection') {

      _.each(geojson.features, function(feature){

        var coordinates = feature.geometry.coordinates;

        updateBounds[feature.geometry.type](coordinates);

      });

      $rootScope.addTimer('Calculate ' + geojson.id + ' Bounds', geojson.filesize);

      return [ [maxLat,maxLng],[minLat,minLng] ];

    } else {

      throw new Error("Geojson is not a FeatureCollection")

    }
  };

  return Bounds;

});