angular.module('dataCards.directives').directive('choropleth', function($http, choroplethHelpers, leafletBoundsHelpers, $log) {
  return {
    restrict: 'E',
    replace: 'true',
    scope: {
      data: '='
    },
    template: '<div class="choropleth-map-container"><leaflet class="choropleth-map" center="center" bounds="bounds" defaults="defaults" geojson="geojson" legend="legend"></leaflet></div>',
    controller: function($scope) {
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
    },
    link: function($scope) {

      // TODO: temp attribute. Comes from geojson. Replace with real one once API gets up and running.
      var attr = 'VALUE',
          sequentialColors = ['#B09D41', '#323345'],
          divergingColors = ['brown','lightyellow','teal'],
          qualitativeColors = {
            3: ["#8dd3c7","#ffffb3","#bebada"],
            4: ["#8dd3c7","#ffffb3","#bebada","#fb8072"],
            5: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3"],
            6: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462"],
            7: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69"],
            8: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5"],
            9: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9"],
            10: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd"],
            11: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5"],
            12: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]
          },
          nullColor = '#ddd';
          // TODO: assumes min colors = 3, max colors = 12. Enforce this with error catching.
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

      var updateColorScale = function(colorClass) {
        // use LAB color space to approximate perceptual brightness,
        // bezier interpolation, and auto-correct for color brightness.
        // See more: https://vis4.net/blog/posts/mastering-multi-hued-color-scales/
        var colorRange;
        switch (colorClass.toLowerCase()) {
          case 'diverging':
            colorRange = divergingColors;
            coL = false;
            bezier = false;
            break;
          case 'qualitative':
            colorRange = qualitativeColors[classBreaks.breaks.length];
            coL = false;
            bezier = false;
            break;
          case 'sequential':
            colorRange = sequentialColors;
            coL = true;
            bezier = true;
            break;
          default:
            throw new Error("[MapController] Invalid color class specified for updateColorScale");
        }
        if (bezier) {
          colors = chroma.interpolate.bezier(colorRange);
        } else {
          colors = colorRange;
        }
        scale = new chroma.scale(colors)
          .domain(classBreaks.breaks)
          .correctLightness(coL)
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

      function updateGeojson(featureCollections) {
        // TODO: temp attribute used
        var data = getGeojsonData(featureCollections);
        updateClassBreaks(data);
        updateColorScale('qualitative');
        // initiate/update legend, with class breaks and colors
        $scope.legend = {
          position: 'bottomleft',
          colors: classBreaks.breaks ? scale.colors() : [],
          classBreaks: classBreaks.breaks
        }
        // update geojson layer(s)
        $scope.geojson = {
          data: featureCollections,
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

      $scope.$watch('data', function(data){
        if (!data) return;
        debugger
        updateGeojson(data);
      });
    }
  }
});