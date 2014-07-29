angular.module('dataCards.directives').directive('choropleth', function(AngularRxExtensions, ChoroplethHelpers, leafletBoundsHelpers, $log, $timeout) {

  // AGGREGATE_VALUE_PROPERTY_NAME is an internal implementation name for the aggregate data
  // value we will display on the choropleth. This name is global, constant and has been
  // chosen so that it is unlikely to collide with any user-defined property on the
  // GeoJSON object we receive.
  var AGGREGATE_VALUE_PROPERTY_NAME = '__SOCRATA_MERGED_VALUE__';
  var FILTERED_VALUE_PROPERTY_NAME = '__SOCRATA_UNFILTERED_VALUE__';
  var AGGREGATE_VALUE_HIGHLIGHTED_NAME = '__SOCRATA_FEATURE_HIGHLIGHTED__';
  var HUMAN_READABLE_PROPERTY_NAME = '__SOCRATA_HUMAN_READABLE_NAME__';
  var INTERNAL_DATASET_FEATURE_ID = '_feature_id';

  // if the number of unique values in the dataset is <= the threshold, displays
  // 1 color for each unique value, and labels them as such in the legend.
  var threshold = 6;

  /*   TEMPORARY SETTINGS   */

      // WARNING: tests depend upon file name.
      numberOfClasses = function(values) {
        // handles numberOfClasses in Jenks (implemented for _.uniq(values).length > 6)
        var numPossibleBreaks = _.uniq(values).length - 1;
        if (numPossibleBreaks <= threshold) {
          throw new Error("[Choropleth] Why are you calling numberOfClasses when # unique values <= " + threshold + "?");
        } else {
          var evenPossibleBreaks = numPossibleBreaks - (numPossibleBreaks % 2);
          var maxNumClasses = evenPossibleBreaks / 2;
        }
        return _.min([oddNumbered(maxNumClasses), 7]);
      }, // TODO: vet this. Assumes odd numbered, always, minus 1 of even.
      defaultColorClass = 'sequential',
      defaultLegendPos = 'bottomright',
      defaultStrokeColor = 'white',
      defaultHighlightColor = '#debb1e',
      defaultSingleColor = 'teal',
      sequentialColors = ['#e4eef0', '#408499'],
      divergingColors = ['brown','lightyellow','teal'], // TODO: assumptions! # features = 1 --> ?
      // qualitativeColors = {
      //   3: ["#8dd3c7","#ffffb3","#bebada"],
      //   4: ["#8dd3c7","#ffffb3","#bebada","#fb8072"],
      //   5: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3"],
      //   6: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462"],
      //   7: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69"],
      //   8: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5"],
      //   9: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9"],
      //   10: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd"],
      //   11: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5"],
      //   12: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]
      // },
      // SAVE this for later use when qualitative colors are implemented.
      nullColor = '#ddd';
      // TODO: assumes min colors = 3, max colors = 12. Enforce this with error catching.


  // Utility functions.
  var oddNumbered = function(num) {
    if (num % 2 == 0) {
      return num - 1;
    } else {
      return num;
    }
  }

  var midpoint = function(val1, val2) {
    if (val1 === undefined || val2 === undefined) {
      throw new Error("Undefined values are not allowed in #midpoint");
    }
    if (val1 === val2) return val1;
    if (val1 > val2) {
      return (val1 - val2) / 2 + val2;
    } else {
      return (val2 - val1) / 2 + val1;
    }
  }

  return {
    restrict: 'E',
    replace: 'true',
    scope: {
      'geojsonAggregateData': '=',
      'rowDisplayUnit': '=?'
    },
    template: '<div class="choropleth-map-container"><leaflet class="choropleth-map" bounds="bounds" defaults="defaults" geojson="geojson" legend="legend"></leaflet></div>',
    controller: function($scope, $http) {
      // Map settings
      $scope.layers = {
        baselayers: {
          mapbox: {
            name: 'MapBox',
            url: 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
            type: 'xyz'
          }
        }
      };

      $scope.defaults = {
        tileLayer: 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
        zoomControlPosition: 'topleft',
        tileLayerOptions: {
          opacity: 0.15,
          detectRetina: true,
          reuseTiles: true
        },
        scrollWheelZoom: false
      };
      $scope.bounds = {}; // Initial bounds are empty. Consider caching a sensible bounds on the card data so we can
                          // show a sensible default view while we get the geojson. However, a spinner might be a better
                          // idea.

    },
    link: function($scope, element) {

      AngularRxExtensions.install($scope);

      $scope.highlightedFeatures = {};

      /* Size map responsively */

      // includes CSS margins + CSS padding when outerWidth, outerHeight set to true
      var containerPaddingX = element.outerWidth(true) - element.width();
      var containerPaddingY = element.outerHeight(true) - element.height();

      $scope.$on('elementResized', function(event, arguments){
        $timeout(function(){
          $scope.$broadcast('mapContainerResized')
        });
      });

      /* Choropleth styles */

      var scale;

      // Extended with 'highlighted' argument so that leaflet can query using that
      // flag to get the right style for the region.
      var fillColor = function(fillClass, feature, highlighted) {
        if (!feature.properties || !feature.properties[AGGREGATE_VALUE_PROPERTY_NAME]) {
          return nullColor;
        } else {
          if (highlighted) {
            if (fillClass == 'none') {
              return 'transparent';
            } else if (fillClass == 'single') {
              return defaultSingleColor;
            } else if (fillClass == 'multi') {
              var value = Number(feature.properties[AGGREGATE_VALUE_PROPERTY_NAME]);
              return scale(value).hex();
            } else {
              throw new Error("Invalid fillClass on #fill: " + fillClass);
            }
          } else {
            if (fillClass == 'none') {
              return 'transparent';
            } else if (fillClass == 'single') {
              return defaultSingleColor;
            } else if (fillClass == 'multi') {
              var value = Number(feature.properties[AGGREGATE_VALUE_PROPERTY_NAME]);
              return scale(value).hex();
            } else {
              throw new Error("Invalid fillClass on #fill: " + fillClass);
            }
          }
        }
      };

      // Extended with 'highlighted' argument so that leaflet can query using that
      // flag to get the right style for the region.
      var strokeColor = function(fillClass, feature, highlighted) {
        if (feature.geometry.type != "LineString" && feature.geometry.type != "MultiLineString") {
          if (highlighted) {
            return defaultHighlightColor;
          } else {
            return defaultStrokeColor;
          }
        } else {
          if (!feature.properties || !feature.properties[AGGREGATE_VALUE_PROPERTY_NAME]) {
            return nullColor;
          } else {
            if (highlighted) {
              if (fillClass == 'none') {
                return defaultHighlightColor;
              } else if (fillClass == 'single') {
                return defaultHighlightColor;
              } else if (fillClass == 'multi') {
                return defaultHighlightColor;
              } else {
                throw new Error("Invalid fillClass on #fill: " + fillClass);
              }
            } else {
              if (fillClass == 'none') {
                return 'black';
              } else if (fillClass == 'single') {
                return defaultSingleColor;
              } else if (fillClass == 'multi') {
                // for LineString or MultiLineString, strokeColor is the same as a feature's 'fill color'
                return fillColor(fillClass, feature, fillClass);
              } else {
                throw new Error("Invalid fillClass on #fill: " + fillClass);
              }            
            }
          }
        }
      };

      // Extended with 'highlighted' argument so that leaflet can query using that
      // flag to get the right style for the region.
      var strokeWidth = function(fillClass, feature, highlighted) {
        if (feature.geometry.type == 'MultiLineString' || feature.geometry.type == 'LineString') {
          if (highlighted) {
            return 3;
          } else {
            return 3;
          }
        } else {
          if (highlighted) {
            return 3;
          } else {
            return 1;
          }
        }
      };

      // Extended with 'highlighted' argument so that leaflet can query using that
      // flag to get the right style for the region.
      var noStyleFn = function(feature, highlighted) {
        // NOTE: leaflet requires separate style functions for each fill class
        var fillClass = 'none';
        return {
          fillColor: fillColor(fillClass, feature, highlighted),
          color: strokeColor(fillClass, feature, highlighted),
          weight: strokeWidth(fillClass, feature, highlighted),
          opacity: fillClass == 'none' ? 1 : 0.8,
          dashArray: 0,
          fillOpacity: fillClass == 'none' ? 1 : 0.8,
        };
      };

      // Extended with 'highlighted' argument so that leaflet can query using that
      // flag to get the right style for the region.
      var singleStyleFn = function(feature, highlighted) {
        // NOTE: leaflet requires separate style functions for each fill class
        var fillClass = 'single';
        return {
          fillColor: fillColor(fillClass, feature, highlighted),
          color: strokeColor(fillClass, feature, highlighted),
          weight: strokeWidth(fillClass, feature, highlighted),
          opacity: fillClass == 'none' ? 1 : 0.8,
          dashArray: 0,
          fillOpacity: fillClass == 'none' ? 1 : 0.8,
        };
      };

      // Extended with 'highlighted' argument so that leaflet can query using that
      // flag to get the right style for the region.
      var multiStyleFn = function(feature, highlighted) {
        // NOTE: leaflet requires separate style functions for each fill class
        fillClass = 'multi';
        return {
          fillColor: fillColor(fillClass, feature, highlighted),
          color: strokeColor(fillClass, feature, highlighted),
          weight: strokeWidth(fillClass, feature, highlighted),
          opacity: fillClass == 'none' ? 1 : 0.8,
          dashArray: 0,
          fillOpacity: fillClass == 'none' ? 1 : 0.8,
        };
      };

      var styleClass = function(fillClass) {
        if (fillClass == 'none') {
          return noStyleFn;
        } else if (fillClass == 'single') {
          return singleStyleFn;
        } else if (fillClass == 'multi') {
          return multiStyleFn;
        }
      };

      /* Operations for updating Geojson */

      var computeClassBreaks = function(values) {
        // TODO: Jenks for now, with configurable number of classes.
        // Support more types later, depending on spec.
        if (values.length == 0) {
          throw new Error("No values. Cannot haz clAss BreAks, says Randy.");
        }
        var uniqValues = _.uniq(values);
        var numPossibleBreaks = uniqValues.length - 1;
        var classBreaks;

        if (numPossibleBreaks <= threshold) {
          // for such small values, jenks does not make sense (produces duplicate values).
          // use equal interval in such cases.
          var classBreaks = ChoroplethHelpers.createClassBreaks({
            method: 'niceEqualInterval',
            data: values,
            numberOfClasses: values.length
          });
        } else {
          var classBreaks = ChoroplethHelpers.createClassBreaks({
            method: 'jenks',
            data: values,
            numberOfClasses: numberOfClasses(values)
          });
        }
        return classBreaks;
      };

      var midpointMap = function(values) {
        // maps a collection of values to a collection of classes whose ranges are set at its midpoints
        // e.g., [1,2,3,4] --> [0.5, 1.5, 2.5, 3.5, 4.5]
        // e.g., [5,10,20,25] --> [2.5, 7.5, 15, 22.5, 27.5]
        var numValues = values.length;
        if (numValues === 0) {
          $log.error('Null argument called on #midpointMap. No values.');
        } else if (numValues === 1) {
          return [values[0] - 1, values[0] + 1];
        } else {
          var initialAccum = [values[0] - midpoint(values[0], values[1])];
          var midpoints = _.reduce(values, function(result, val, i) {
            if (i == values.length - 1) {
              result.push(val + midpoint(val, values[i - 1]));
            } else {
              result.push(midpoint(val, values[i + 1]));
            }
            return result;
          }, initialAccum);
          return midpoints;
        }
      }

      var updateMulticolorScale = function(colorClass, classBreaks) {
        if (!classBreaks) {
          throw new Error("Invalid class breaks");
        }
        if (classBreaks.length < 2) {
          throw new Error("updateColorScale only valid for choropleths with >= 2 class breaks.")
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
          // case 'qualitative':
          //   colorRange = qualitativeColors[classBreaks.length];
          //   lightnessCorrection = false;
          //   bezierColorInterpolation = false;
          //   break;
          // ^ SAVE for when we implement qualitative colors.
          case 'sequential':
            colorRange = sequentialColors;
            lightnessCorrection = true;
            bezierColorInterpolation = true;
            break;
          default:
            throw new Error("[choropleth] Invalid color class specified for updateColorScale");
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
          classBreaks: classBreaks,
          threshold: threshold,
          legendStyle: 'modern',
          legendClass: 'modern-legend'
        };
      }

      /* Choropleth highlight feature effect */

      var highlightFeature = function(featureId) {
        //if (!$scope.highlightedFeatures.hasOwnProperty(featureId)) {
        //  $scope.highlightedFeatures[featureId] = true;
        //}
        // TEMPORARILY OVERRIDING THE ABOVE FOR MVP:
        // Only allow one item to be highlighted at a time, so we just replace the
        // highlighted cache instead:
        $scope.highlightedFeatures = {};
        $scope.highlightedFeatures[featureId] = true;
      }

      var unhighlightFeature = function(featureId) {
        if ($scope.highlightedFeatures.hasOwnProperty(featureId)) {
          delete $scope.highlightedFeatures[featureId];
        }
      }

      var featureIsHighlighted = function(featureId) {
        return $scope.highlightedFeatures.hasOwnProperty(featureId);
      };

      /* Dataset filtering */

      // Send the toggle filter event up the scope to the parent, where it can
      // be handled by the model.
      var filterDataset = function(selectedFeature, callback) {
        var featureId = selectedFeature.properties[INTERNAL_DATASET_FEATURE_ID];
        highlightFeature(featureId);
        $scope.$emit(
          'toggle-dataset-filter:choropleth',
          selectedFeature,
          callback);
      }

      // Send the toggle filter event up the scope to the parent, where it can
      // be handled by the model.
      var clearDatasetFilter = function(selectedFeature, callback) {
        var featureId = selectedFeature.properties[INTERNAL_DATASET_FEATURE_ID];
        unhighlightFeature(featureId);
        $scope.$emit(
          'toggle-dataset-filter:choropleth',
          selectedFeature,
          callback);
      }

      /* Region click handling */

      var singleClickSuppressionThreshold = 200;
      var doubleClickThreshold = 400;
      var lastClick = 0;
      var lastClickTimeout = null;

      $scope.$on('leafletDirectiveMap.geojsonClick', function(event, selectedFeature, leafletEvent) {

        if (!$scope.geojson.resetStyleOnGeojsonClick) {
          throw new Error("To unhighlight feature, set geojson resetStyleOnGeojsonClick: true");
        }

        var now = Date.now();
        // NOTE: uses real timestamp, so testing this requires an actual timeout, not just a mocked timeout!
        var delay = now - lastClick;
        lastClick = now;
        if (delay < doubleClickThreshold) {
          if (lastClickTimeout != null) {
            $timeout.cancel(lastClickTimeout);
            // Cancels single click event handler.
            // Map zooms in by default setting on $scope.geojson.zoomOnDoubleClick
          }
        } else {
          lastClickTimeout = $timeout(function() {
            var featureId = selectedFeature.properties[INTERNAL_DATASET_FEATURE_ID];
            // single click --> filters dataset
            if (featureIsHighlighted(featureId)) {
              clearDatasetFilter(selectedFeature, function(ok) {
                if (ok) {
                  // TODO: Do something?
                }
              });
            } else {
              filterDataset(selectedFeature, function(ok) {
                if (ok) {
                  // TODO: Do something?
                }
              });
            }
          }, singleClickSuppressionThreshold);
        }
      });

      /* Region mouseover tooltip effect */

      var $tooltip;

      var initializeChoroFlyout = function() {
        $tooltip = $('#choro-flyout');

        if ($tooltip.length == 0) {
          $('body').append('<div class="flyout flyout-table top" id="choro-flyout"><div class="flyout-arrow"></div><span class="content"></span></div>');
          $tooltip = $('#choro-flyout');
          $tooltip.hide();

          $tooltip
            .mousemove(function(e) {
                positionTooltip($tooltip, e);
            })
            .mouseout(function() {
              //remove bug where tooltip doesn't disappear when hovering on map
              if ($("#choro-flyout:hover").length == 0) {
                $tooltip.hide();
              }
            });
        };

        return $tooltip;
      };

      var positionTooltip = function($tooltip, e){
        var top = e.pageY;
        var left = e.pageX;
        var height = $tooltip.outerHeight();
        var width = $tooltip.outerWidth();

        $tooltip.css("top", (top - height - 15));
        $tooltip.css("left", (left - (width/2)));
      };

      var mousemoveFeature = function(e) {
        $tooltip.show();
        positionTooltip($tooltip, e);
      };

      var mouseoutFeature = function() {
        if ($("#choro-flyout:hover").length == 0) {
          $tooltip.hide();
        }
      };

      var handleMouseEvents = function() {
        var $overlayPane = element.find('.leaflet-overlay-pane');
        $overlayPane.on('mousemove', 'path', mousemoveFeature);
        $overlayPane.on('mouseout', 'path', mouseoutFeature);
      };

      var initializeFeatureEventHandlers = _.once(handleMouseEvents);

      var brightenFeatureStyleObject = {
        weight: 4
      };

      var unbrightenFeatureStyleObject = {
        weight: 1
      };

      var mouseoverBrighten = function(leafletEvent) {
        var layer = leafletEvent.target;
        var featureId = layer.feature.properties[INTERNAL_DATASET_FEATURE_ID];
        if (!featureIsHighlighted(featureId)) {
          layer.setStyle(brightenFeatureStyleObject);
          layer.bringToFront();
        }
      }

      var mouseoutUnbrighten = function(leafletEvent) {
        var layer = leafletEvent.target;
        var featureId = layer.feature.properties[INTERNAL_DATASET_FEATURE_ID];
        if (!featureIsHighlighted(featureId)) {
          layer.setStyle(unbrightenFeatureStyleObject);
          layer.bringToBack();
        }
      }

      $scope.$on('leafletDirectiveMap.geojsonMouseover', function(event, leafletEvent) {
        // equivalent to a mouseenter

        // initialize choro flyout element.
        // can disappear on card collapse.
        $tooltip = initializeChoroFlyout();
        var layer = leafletEvent.target;
        var feature = layer.feature;
        var featureHumanReadableName = feature.properties[HUMAN_READABLE_PROPERTY_NAME];
        var value = feature.properties[AGGREGATE_VALUE_PROPERTY_NAME];
        if (value === undefined || value === null) {
          value = '(No Value)';
          var valueIsUndefined = true;
        }
        var message = '<h4>' + String(featureHumanReadableName).capitaliseEachWord() + '</h4>' +
                      $.commaify(value);

        $tooltip.find('.content').removeClass('undefined');

        if (valueIsUndefined) {
          $tooltip.find('.content').addClass('undefined');
        } else if ($scope.rowDisplayUnit) {
          message += ' ' + $scope.rowDisplayUnit.pluralize();
        }

        $tooltip.find('.content').html(message);

        initializeFeatureEventHandlers();
        mouseoverBrighten(leafletEvent);
      });

      $scope.$on('leafletDirectiveMap.geojsonMouseout', function(event, leafletEvent) {
        if (_.isEmpty($("#choro-flyout:hover"))) {
          $tooltip.hide();
        }
        mouseoutUnbrighten(leafletEvent);
      });

      /* React to data changes further up the stack */

      $scope.observe('geojsonAggregateData').subscribe(
        function(geojsonAggregateData) {

          var colors;
          var values;

          var filterHighlightedGeojsonFeatures = function(geojsonData) {
            var newGeojsonData = {};
            var newFeatures = [];
            newGeojsonData.crs = (typeof geojsonData.crs !== 'undefined') ? geojsonData.crs : null;
            newGeojsonData.type = (typeof geojsonData.type !== 'undefined') ? geojsonData.type : null;
            newGeojsonData.features = geojsonData.features.filter(function(item) {
              if (item.hasOwnProperty('properties') &&
                  item.properties.hasOwnProperty(INTERNAL_DATASET_FEATURE_ID)) {
                return featureIsHighlighted(item.properties[INTERNAL_DATASET_FEATURE_ID]);
              } else {
                return false;
              }
            });
            return newGeojsonData;
          };

          var updateGeojsonScope = function(fillClass) {
            $scope.geojson = {
              data: geojsonAggregateData,
              // Pass along knowledge of which regions are highlighted so they can be
              // drawn as such on the next leaflet render cycle.
              highlighted: filterHighlightedGeojsonFeatures(geojsonAggregateData),
              style: styleClass(fillClass),
              resetStyleOnGeojsonClick: true,
              zoomOnDoubleClick: true
            };
          };

          if (!geojsonAggregateData) {
            return;
          }

          values = ChoroplethHelpers.getGeojsonValues(geojsonAggregateData, FILTERED_VALUE_PROPERTY_NAME);

          if (values.length === 0) {
            // no values, just render polygons with no colors
            updateGeojsonScope('none');
          } else {

            if (!$scope.classBreaks) {
              $scope.classBreaks = computeClassBreaks(values);
            }

            if ($scope.classBreaks.length === 1) {
              colors = [defaultSingleColor];
              updateGeojsonScope('single');
            } else {
              updateMulticolorScale(defaultColorClass, $scope.classBreaks);
              colors = scale.colors();
              updateGeojsonScope('multi');
            }

            if (!$scope.legend){
              updateLegend($scope.classBreaks, colors);
            }

          }

          updateBounds(geojsonAggregateData);
        });
    }
  }
});
