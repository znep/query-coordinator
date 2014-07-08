angular.module('dataCards.directives').directive('choropleth', function(AngularRxExtensions, ChoroplethHelpers, leafletBoundsHelpers, $log, $timeout) {

  // AGGREGATE_VALUE_PROPERTY_NAME is an internal implementation name for the aggregate data
  // value we will display on the choropleth. This name is global, constant and has been
  // chosen so that it is unlikely to collide with any user-defined property on the
  // GeoJSON object we receive.
  var AGGREGATE_VALUE_PROPERTY_NAME = '__MERGED_SOCRATA_VALUE__';

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
      defaultStrokeColor = '#666',
      defaultHighlightColor = 'white',
      defaultSingleColor = 'teal',
      sequentialColors = ['#B09D41', '#323345'],
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


  // utility functions
  function oddNumbered(num) {
    if (num % 2 == 0) {
      return num - 1;
    } else {
      return num;
    }
  }

  function midpoint(val1, val2) {
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
      'model': '=',
      'geojsonAggregateData': '=',
      'showFiltered': '='
    },
    template: '<div class="choropleth-map-container"><leaflet class="choropleth-map" center="center" bounds="bounds" defaults="defaults" geojson="geojson" legend="legend"></leaflet></div>',
    controller: function($scope, $http) {
      // Map settings
      $scope.center = {};

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
    },
    link: function($scope, element) {

      AngularRxExtensions.install($scope);

      $scope.fieldName = $scope.observe('model').value.fieldName;

      /* Size map responsively */

      var containerPaddingX = element.outerWidth(true) - element.width(),
          containerPaddingY = element.outerHeight(true) - element.height();
          // includes CSS margins + CSS padding when outerWidth, outerHeight set to true

      $scope.$on('elementResized', function(event, arguments){
        $timeout(function(){
          $scope.$broadcast('mapContainerResized')
        });
      });

      /* Choropleth Styles */

      var scale;

      // Extended with 'highlighted' argument so that leaflet can query using that
      // flag to get the right style for the region.
      var fillColor = function(fillClass, feature, highlighted) {
        if (!feature.properties || !feature.properties[AGGREGATE_VALUE_PROPERTY_NAME]) {
          return nullColor;
        } else {
          if (highlighted) {
            if (fillColor == 'none') {
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
            if (fillColor == 'none') {
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
      function noStyleFn(feature, highlighted) {
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
      function singleStyleFn(feature, highlighted) {
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
      function multiStyleFn(feature, highlighted) {
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

      var classBreaksFromValues = function(values) {
        // TODO: Jenks for now, with configurable number of classes.
        // Support more types later, depending on spec.
        if (values.length == 0) {
          throw new Error("No values. Cannot haz clAss BreAks, says Randy.");
        }
        var uniqValues = _.uniq(values);
        var numPossibleBreaks = uniqValues.length - 1;

        if (numPossibleBreaks <= threshold) {
          // for such small values, jenks does not make sense.
          // explicitly include all values in legend.
          // return array of explicit legend labels for each value
          return uniqValues.sort();
        } else {
          return ChoroplethHelpers.createClassBreaks({
            method: 'jenks',
            data: values,
            numberOfClasses: numberOfClasses(values)
          });
        }
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
        if (classBreaks.length <= threshold) {
          // class breaks are a list of values with a 1-1 correspondence to its colors.
          // adjust chroma scale accordingly to grab the right color with scale(value),
          // and return a set of scale.colors() whose length is the same as classBreaks.length
          var adjustedClassBreaks = midpointMap(classBreaks);
        }
        scale = new chroma.scale(colors)
          .domain(adjustedClassBreaks || classBreaks)
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
          threshold: threshold
        };
      }

      // Choropleth Highlight Feature Effect

      $scope.highlightedFeatures = {};

      function highlightFeature(featureId) {
        //if (!$scope.highlightedFeatures.hasOwnProperty(featureId)) {
        //  $scope.highlightedFeatures[featureId] = true;
        //}
        // TEMPORARILY OVERRIDING THE ABOVE FOR MVP:
        // Only allow one item to be highlighted at a time, so we just replace the
        // highlighted cache instead:
        $scope.highlightedFeatures = {};
        $scope.highlightedFeatures[featureId] = true;
      }

      function unhighlightFeature(featureId) {
        if ($scope.highlightedFeatures.hasOwnProperty(featureId)) {
          delete $scope.highlightedFeatures[featureId];
        }
      }

      function featureIsHighlighted(featureId) {
        return $scope.highlightedFeatures.hasOwnProperty(featureId);
      };

      // Dataset filtering.

      function filterDataset(selectedFeature, callback) {
        // Send the toggle filter event up the scope to the parent, where it can
        // be handled by the model.
        $scope.$emit(
          'toggle-dataset-filter:choropleth',
          $scope.fieldName,
          selectedFeature,
          callback);
      }

      function clearDatasetFilter(selectedFeature, callback) {
        // Send the toggle filter event up the scope to the parent, where it can
        // be handled by the model.
        $scope.$emit(
          'toggle-dataset-filter:choropleth',
          $scope.fieldName,
          selectedFeature,
          callback);
      }

      var singleClickSuppressionThreshold = 200, doubleClickThreshold = 400, lastClick = 0, lastTimer = null;

      $scope.$on('leafletDirectiveMap.geojsonClick', function(event, featureSelected, leafletEvent, leafletGeoJSON) {
        // must distinguish between single click and double click.

        if (!$scope.geojson.resetStyleOnGeojsonClick) {
          throw new Error("To unhighlight feature, set geojson resetStyleOnGeojsonClick: true");
        }

        var now = Date.now();
        // NOTE: uses real timestamp, so testing this requires an actual timeout, not just a mocked timeout!
        var delay = now - lastClick;
        lastClick = now;
        if (delay < doubleClickThreshold) {
          if (lastTimer != null) {
            $timeout.cancel(lastTimer);
            // Cancels single click event handler.
            // Map zooms in by default setting on $scope.geojson.zoomOnDoubleClick
          }
        } else {
          lastTimer = $timeout(function() {
            // single click --> filters dataset
            var selectedFeature = featureSelected.properties[$scope.fieldName];
            if (featureIsHighlighted(selectedFeature)) {
              unhighlightFeature(selectedFeature);
              clearDatasetFilter(selectedFeature, function(ok) {
                if (ok) {
                  // TODO: Do something?
                }
              });
            } else {
              highlightFeature(selectedFeature);
              filterDataset(selectedFeature, function(ok) {
                if (ok) {
                  // TODO: Do something?
                }
              });
            }
          }, singleClickSuppressionThreshold);
        }
      });

      // Choropleth Mouseover Tooltip Effect

      function mouseoverFeature(event, leafletEvent) {
        var feature = leafletEvent.target.feature;
        var value = feature.properties[AGGREGATE_VALUE_PROPERTY_NAME];
        // TODO: mouseover popups
      }

      $scope.$on('leafletDirectiveMap.geojsonMouseover', function(event, leafletEvent) {
        mouseoverFeature(event, leafletEvent);
      });

      // GeoJSON Data Plumbing.

      function filterHighlightedGeojsonFeatures(geojsonData) {
        
        var newGeojsonData = {};
        var newFeatures = [];

        newGeojsonData.crs = (typeof geojsonData.crs !== 'undefined') ? geojsonData.crs : null;
        newGeojsonData.type = (typeof geojsonData.type !== 'undefined') ? geojsonData.type : null;

        newGeojsonData.features = geojsonData.features.filter(function(item) {
          if (item.hasOwnProperty('properties') &&
              item.properties.hasOwnProperty($scope.fieldName)) {
            return featureIsHighlighted(item.properties[$scope.fieldName]);
          } else {
            return false;
          }
        });

        return newGeojsonData;

      };

      Rx.Observable.subscribeLatest(
        $scope.observe('geojsonAggregateData'),
        $scope.observe('showFiltered'),
        function(geojsonAggregateData, showFiltered) {

          if (!geojsonAggregateData) {
            return;
          }

          var colors;
          var values = ChoroplethHelpers.getGeojsonValues(geojsonAggregateData, AGGREGATE_VALUE_PROPERTY_NAME);
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

          if (values.length === 0) {
            // no values, just render polygons with no colors
            updateGeojsonScope('none');
          } else {

            if (!$scope.classBreaks) {
              $scope.classBreaks = classBreaksFromValues(values);
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
        }
      );

    }
  }
});
