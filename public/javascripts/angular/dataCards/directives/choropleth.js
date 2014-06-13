angular.module('dataCards.directives').directive('choropleth', function($http, ChoroplethHelpers, leafletBoundsHelpers, $log, $timeout) {
  // TODO: temp attribute.
  // Replace with real one once API gets up and running.
  var attr = 'VALUE',
      numberOfClasses = 5,
      defaultColorClass = 'diverging',
      defaultLegendPos = 'bottomleft',
      defaultStrokeColor = '#666',
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
  return {
    restrict: 'E',
    replace: 'true',
    scope: {
      data: '='
    },
    template: '<div class="choropleth-map-container"><leaflet class="choropleth-map" center="center" bounds="bounds" defaults="defaults" geojson="geojson" legend="legend"></leaflet></div>',
    controller: function($scope, $http) {
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

      $http.get('/datasets/geojson/Neighborhoods_2012b.json').then(function(result) {
        // GeoJson was reprojected and converted to Geojson with http://converter.mygeodata.eu/vector
        // reprojected to WGS 84 (SRID: 4326)
        $scope.geojsonData = result.data;
        // TODO: invalid geojsonData --> ???
      });
    },
    link: function($scope, element) {

      /* Size map responsively */

      var containerPaddingX = element.outerWidth(true) - element.width(),
          containerPaddingY = element.outerHeight(true) - element.height();
          // includes CSS margins + CSS padding when outerWidth, outerHeight set to true

      $scope.$on('elementResized', function(event, arguments){
        var width = arguments[0], height = arguments[1];
        width = width - containerPaddingX;
        height = height - containerPaddingY;
        element.find('.choropleth-map').css({ width: width, height: height });
        $timeout(function(){
          $scope.$broadcast('mapContainerResized')
        });
      });

      /* Choropleth Styles */

      var scale;

      var fillColor = function(feature) {
        if (feature.properties[attr] == null || feature.properties[attr] === undefined ) {
          return nullColor;
        }
        var value = Number(feature.properties[attr]);
        return scale(value).hex();
      };

      var strokeColor = function(feature) {
        if (feature.geometry.type != 'LineString' || feature.geometry.type != 'MultiLineString') {
          return defaultStrokeColor;
        }
        // for LineString or MultiLineString, strokeColor is the same as a feature's 'fill color'
        return fillColor(feature);
      };

      var strokeWidth = function(feature) {
        if (feature.geometry.type == 'MultiLineString' || feature.geometry.type == 'LineString') {
          return 3;
        }
        return 1;
      };

      var style = function(feature) {
        return {
          fillColor: fillColor(feature),
          weight: strokeWidth(feature),
          opacity: 0.8,
          color: strokeColor(feature),
          dashArray: 0,
          fillOpacity: 0.8
        };
      };

      /* Operations for updating Geojson */

      var classBreaksFromValues = function(values) {
        // TODO: Jenks for now, with configurable number of classes.
        // Support more types later, depending on spec.
        return ChoroplethHelpers.createClassBreaks({
          method: 'jenks',
          data: values,
          numberOfClasses: numberOfClasses
        });
      };

      var updateColorScale = function(colorClass, classBreaks) {
        if (!classBreaks) {
          throw new Error("Invalid class breaks");
        }
        // use LAB color space to approximate perceptual brightness,
        // bezier interpolation, and auto-correct for color brightness.
        // See more: https://vis4.net/blog/posts/mastering-multi-hued-color-scales/
        var colorRange;
        switch (colorClass.toLowerCase()) {
          case 'diverging':
            colorRange = divergingColors;
            lightnessCorrection = false;
            bezierColorInterpolation = false;
            break;
          case 'qualitative':
            colorRange = qualitativeColors[classBreaks.length];
            lightnessCorrection = false;
            bezierColorInterpolation = false;
            break;
          case 'sequential':
            colorRange = sequentialColors;
            lightnessCorrection = true;
            bezierColorInterpolation = true;
            break;
          default:
            throw new Error("[MapController] Invalid color class specified for updateColorScale");
        }
        if (bezierColorInterpolation) {
          colors = chroma.interpolate.bezier(colorRange);
        } else {
          colors = colorRange;
        }
        scale = new chroma.scale(colors)
          .domain(classBreaks)
          .correctLightness(lightnessCorrection)
          .mode('lab');
      };

      var updateBounds = function(geojson) {
        $scope.bounds = leafletBoundsHelpers.createBoundsFromArray(ChoroplethHelpers.createBoundsArray(geojson));
      };

      var updateLegend = function(classBreaks, colors) {
        $scope.legend = {
          position: defaultLegendPos,
          colors: classBreaks ? colors : [],
          classBreaks: classBreaks
        };
      }

      /* Update Geojson upon new data */

      function updateGeojson(geojsonData) {
        var values = ChoroplethHelpers.getGeojsonValues(geojsonData, attr);
        var classBreaks = classBreaksFromValues(values);
        updateColorScale(defaultColorClass, classBreaks);
        updateBounds(geojsonData);
        updateLegend(classBreaks, scale.colors());
        // update geojson layer(s)
        $scope.geojson = {
          data: geojsonData,
          style: style,
          resetStyleOnMouseout: true
        };
      }

      // Choropleth Highlight Feature Effect

      function highlightFeature(leafletEvent) {
        var layer = leafletEvent.target;
        layer.setStyle({
          weight: 3,
          color: 'white',
          opacity: 1
        });
        layer.bringToFront();
      }

      $scope.$on('leafletDirectiveMap.geojsonMouseover', function(event, leafletEvent) {
        highlightFeature(leafletEvent);
      });

      $scope.$watch('geojsonData', function(geojsonData){
        if (!geojsonData) return;
        updateGeojson(geojsonData);
      });
    }
  }
});