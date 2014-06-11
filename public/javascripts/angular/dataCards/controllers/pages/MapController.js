angular.module('dataCards.controllers')
.controller('MapController', function($scope, $location, $http, choroplethHelpers, leafletBoundsHelpers, $timeout, $rootScope, $log) {

  $rootScope.addTimer('Initialize Timers and Map Controller');

  // Map settings
  $scope.center = {};

  $scope.layers = {
    baselayers: {
      mapbox: {
        name: 'MapBox',
        url: 'http://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
        type: 'xyz'
      }
    }
  };

  $scope.defaults = {
    tileLayer: 'http://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
    zoomControlPosition: 'topleft',
    tileLayerOptions: {
      opacity: 0.15,
      detectRetina: true,
      reuseTiles: true
    },
    scrollWheelZoom: false
  };

  // TODO: temp attribute. Comes from geojson. Replace with real one once API gets up and running.
  var attr = 'VALUE', lowColor = '#B09D41', hiColor = '#323345', nullColor = '#ddd';

  // Choropleth Styles

  var classBreaks = {};
  var scale;

  classBreaks.findIndex = function(val) {
    //  Ranges are defined as follows:
    //
    //  for class breaks   *---*---*---*
    //  range 0:           *---*
    //  range 1:               0---*
    //  range 2:                   0---*
    var breaks = this.breaks;
    var lastIndex = breaks.length - 1;
    if (breaks.length < 2) {
      $log.error('Invalid number of class breaks specified.');
    }
    for (var i = 0; i < (breaks.length - 1); i++) {
      if (val >= breaks[i] && val <= breaks[i+1]) {
        return i;
      }
    }
  }
  var fillColor = function(feature) {
    if (feature.properties[attr] == null || feature.properties[attr] === undefined ) {
      return nullColor;
    } else {
      var value = Number(feature.properties[attr]);
      return scale(value).hex();
    }
  };

  var color = function(feature) {
    return 'white';
  }

  var weight = function(feature) {
    if (feature.geometry.type != 'MultiLineString') {
      return 1;
    } else {
      return 3;
    }
  }

  var style = function(feature) {
    return {
      fillColor: fillColor(feature),
      weight: weight(feature),
      opacity: 0.8,
      color: color(feature),
      dashArray: 0,
      fillOpacity: 0.8
    };
  };

  var updateColorScale = function() {
    // use LAB color space to approximate perceptual brightness,
    // bezier interpolation, and auto-correct for color brightness.
    // See more: https://vis4.net/blog/posts/mastering-multi-hued-color-scales/
    var bezierColor = chroma.interpolate.bezier([lowColor, hiColor]);
    scale = new chroma.scale(bezierColor)
      .domain(classBreaks.breaks)
      .correctLightness(true)
      .mode('lab');
  }
  var updateClassBreaks = function(data) {
    classBreaks.breaks = choroplethHelpers.createClassBreaks({
      method: 'jenks',
      data: data,
      numberOfClasses: 4
    });
  }

  var getGeojsonData = function(featureCollections) {
    var features = _.pluck(featureCollections, 'features');
    var data = [];
    _.each(features[0], function(feature){
      var val = feature.properties[attr];
      if (val === undefined || val === null) {
        return;
      } else {
        data.push(feature.properties[attr]);
      }
    });
    return data;
  }

  function updateGeojson(featureCollections,id) {
    // TODO: temp attribute used
    var data = getGeojsonData(featureCollections);
    updateClassBreaks(data);
    updateColorScale();
    // initiate/update legend, with class breaks and colors
    $scope.legend = {
      position: 'bottomleft',
      colors: classBreaks.breaks ? scale.colors() : [],
      classBreaks: classBreaks.breaks
    }
    // update geojson layer(s)
    $scope.geojson = {
      data: featureCollections,
      id: id,
      style: style,
      resetStyleOnMouseout: true
    };
  }

  // Choropleth Style Effects
  $scope.$on('leafletDirectiveMap.geojsonMouseover', function(event, leafletEvent) {
    highlightFeature(leafletEvent);
  });

  function highlightFeature(leafletEvent) {
    var layer = leafletEvent.target;
    layer.setStyle({
      weight: 3,
      color: 'white',
      opacity: 1
    });
    layer.bringToFront();
  }

  // Toggle demo layer controls

  $scope.possibleLayers = ['Neighborhoods_2012b','CTA_Routes', 'CTA_BusStops', 'PoliceDistrict','PublicSchool'];

  $scope.desiredLayers = [];

  $scope.previousAction == 'init';

  $scope.loadingMethod = undefined;

  $scope.updateLoadingMethod = function(method) {
    $scope.loadingMethod = method;
  }

  // Manipulate Geojson on Map

  var Geojson = {};

  $scope.data = [];

  $scope.updateDesiredLayers = function(layer) {
    // toggle desirability of layer

    // log previous duration
    $scope.previousDuration = $rootScope.sumTimers;
    // reset timers
    $rootScope.timers = [];
    $rootScope.sumTimers = 0;
    $rootScope.addTimer('Reset Timer');
    toggleLayers(layer);
  }

  function toggleLayers(layer) {
    if (_.contains($scope.desiredLayers, layer)) {
      $scope.desiredLayers = _.filter($scope.desiredLayers, function(l){ return l != layer });
      removeLayer(layer);
    } else {
      $scope.desiredLayers.push(layer);
      addLayer(layer);
    }
  }

  function removeLayer(layer) {
    if ($scope.loadingMethod == 'Many') {
      // since duration only gets added to a data layer in retrospect (after the next action request is initiated),
      // and the duration of the current action (sumTimers) gets updated upon layer removal, then
      // if the user is removing a layer that is not the last layer,
      // LOG the duration of the last added layer, IF the last action was an add
      if ($scope.previousAction == 'add') {
        $scope.data[$scope.data.length - 1].duration = $scope.previousDuration;
      }
      // update Geojson object to inform the leaflet directive to remove geojson layer
      $scope.data = _.filter($scope.data, function(datum){ return datum.id != layer });
      updateGeojson($scope.data,layer);
    } else if ($scope.loadingMethod == 'One') {
      // reload geojson request with updated list of desired geojsons (removing layer)
      $scope.desiredLayers = _.filter($scope.desiredLayers, function(l){ return l != layer });
      loadSingleGeojsonRequest($scope.desiredLayers);
    }
    // update previous action
    $scope.previousAction = 'remove';
  }

  function addLayer(layer) {
    if ($scope.loadingMethod == 'Many') {
      addGeojsonRequest(layer);
      if ($scope.previousAction == 'add' || $scope.previousAction == 'init') {
        // log duration of last added layer
        $scope.data[$scope.data.length - 1].duration = $scope.previousDuration;
      }
    } else if ($scope.loadingMethod == 'One') {
      loadSingleGeojsonRequest($scope.desiredLayers);
    }
    $scope.previousAction = 'add';
  }

  function addGeojsonRequest(geojsonName) {
   $http.get('/datasets/geojson/'+geojsonName+'.json').then(function(result) {
      // GeoJson was reprojected and converted to Geojson with http://converter.mygeodata.eu/vector
      // reprojected to WGS 84 (SRID: 4326)
      $rootScope.addTimer('GET '+geojsonName);
      var regions = result.data;
      regions.id = geojsonName;
      $scope.bounds = leafletBoundsHelpers.createBoundsFromArray(choroplethHelpers.createBoundsArray(regions));
      $scope.data.push(regions);
      updateGeojson($scope.data,geojsonName);
      $rootScope.addTimer('Request (additional) Geojson layer' + geojsonName, regions.filesize);
    });
  }

  function loadSingleGeojsonRequest(geojsons) {
    if (geojsons.length == 0) {
      $scope.data = [];
      updateGeojson($scope.data,'Null');
      return;
    }
    var masterGeojson = { type: "FeatureCollection", "filesize": 0, "features": [] };
    _.each(geojsons, function(geojsonName, i) {
      $http.get('/datasets/geojson/'+geojsonName+'.json').success(function(data) {
        $rootScope.addTimer('GET ' + geojsonName);
        masterGeojson.features = masterGeojson.features.concat(data.features);
      }).then(function(){
        if (i == 0) {
          // TODO: why is i == 0 the last one?
          $scope.bounds = leafletBoundsHelpers.createBoundsFromArray(choroplethHelpers.createBoundsArray(masterGeojson));
          $scope.data = [masterGeojson]
          updateGeojson($scope.data,'Merged Layers');
        }
      });
    });
  }
});
