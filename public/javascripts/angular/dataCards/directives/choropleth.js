angular.module('dataCards.directives').directive('choropleth', function(ChoroplethHelpers, leafletBoundsHelpers, $log, $timeout) {
  var threshold = 6;
  // if the number of unique values in the dataset is <= the threshold, displays
  // 1 color for each unique value, and labels them as such in the legend.
  /*   TEMPORARY SETTINGS   */
  // TODO: replace with real one once API gets up and running.
  var attr = 'VALUE',
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
      defaultHighlightColor = 'white',
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
      'regions': '='
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

      var fillColor = function(feature, fillClass) {
        if (!feature.properties || !feature.properties[attr]) {
          return nullColor;
        } else {
          if (fillColor == 'none') {
            return 'transparent';
          } else if (fillClass == 'single') {
            return defaultSingleColor;
          } else if (fillClass == 'multi') {
            var value = Number(feature.properties[attr]);
            return scale(value).hex();
          } else {
            throw new Error("Invalid fillClass on #fill: " + fillClass);
          }
        }
      };

      var strokeColor = function(feature, fillClass) {
        if (feature.geometry.type != "LineString" && feature.geometry.type != "MultiLineString") {
          return defaultStrokeColor;
        } else {
          if (!feature.properties || !feature.properties[attr]) {
            return nullColor;
          } else {
            if (fillClass == 'none') {
              return 'black';
            } else if (fillClass == 'single') {
              return defaultSingleColor;
            } else if (fillClass == 'multi') {
              // for LineString or MultiLineString, strokeColor is the same as a feature's 'fill color'
              return fillColor(feature, fillClass);
            } else {
              throw new Error("Invalid fillClass on #fill: " + fillClass);
            }
          }
        }
      };

      var strokeWidth = function(feature) {
        if (feature.geometry.type == 'MultiLineString' || feature.geometry.type == 'LineString') {
          return 3;
        }
        return 1;
      };

      function noStyleFn(feature) {
        // NOTE: leaflet requires separate style functions for each fill class
        var fillClass = 'none';
        return {
          fillColor: fillColor(feature, fillClass),
          color: strokeColor(feature, fillClass),
          weight: strokeWidth(feature, fillClass),
          opacity: fillClass == 'none' ? 1 : 0.8,
          dashArray: 0,
          fillOpacity: fillClass == 'none' ? 1 : 0.8,
        };
      };

      function singleStyleFn(feature) {
        // NOTE: leaflet requires separate style functions for each fill class
        var fillClass = 'single';
        return {
          fillColor: fillColor(feature, fillClass),
          color: strokeColor(feature, fillClass),
          weight: strokeWidth(feature, fillClass),
          opacity: fillClass == 'none' ? 1 : 0.8,
          dashArray: 0,
          fillOpacity: fillClass == 'none' ? 1 : 0.8,
        };
      };

      function multiStyleFn(feature) {
        // NOTE: leaflet requires separate style functions for each fill class
        var fillClass = 'multi';
        return {
          fillColor: fillColor(feature, fillClass),
          color: strokeColor(feature, fillClass),
          weight: strokeWidth(feature, fillClass),
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
            throw new Error("[choropleth] Invalid color class specified for updateColorScale");
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

      /* Update Geojson upon new data */

      function updateGeojson(geojsonData) {
        var colors;
        var values = ChoroplethHelpers.getGeojsonValues(geojsonData, attr);
        var updateGeojsonScope = function(fillClass) {
          $scope.geojson = {
            data: geojsonData,
            style: styleClass(fillClass),
            resetStyleOnGeojsonClick: true,
            zoomOnDoubleClick: true
          };
        }
        if (values.length === 0) {
          // no values, just render polygons with no colors
          updateGeojsonScope('none');
        } else {
          var classBreaks = classBreaksFromValues(values);
          if (classBreaks.length === 1) {
            colors = [defaultSingleColor];
            updateGeojsonScope('single');
          } else {
            updateMulticolorScale(defaultColorClass, classBreaks);
            colors = scale.colors();
            updateGeojsonScope('multi');
          }
        }
        updateLegend(classBreaks, colors);
        updateBounds(geojsonData);
      }

      // Choropleth Highlight Feature Effect

      function highlightLayer(layer) {
        layer.setStyle({
          weight: 4,
          color: defaultHighlightColor,
          opacity: 1
        });
        layer.bringToFront();
        layer.highlighted = true;
      }

      function unhighlightLayer(layer, leafletGeoJSON) {
        // NOTE: only leafletGeoJSON contains #resetStyle method
        leafletGeoJSON.resetStyle(layer);
        layer.highlighted = false;
      }

      function toggleSelectedFeature(layer, leafletGeoJSON) {
        if (layer.highlighted) {
          unfilterDataset(function(ok) {
            if (ok) {
              unhighlightLayer(layer, leafletGeoJSON);
            }
          });
        } else {
          filterDataset(function(ok) {
            if (ok) {
              highlightLayer(layer);
            }
          })
        }
      }

      function filterDataset(selectedLayer, callback) {
        // TODO: Chris, story for filtering dataset
        callback(true);
      }

      function clearDatasetFilter(callback) {
        // TODO: Chris
        callback(true);
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
            var selectedLayer = leafletEvent.target;

            if (!$scope.lastGeoJSONLayerClicked) {
              // first click --> always highlight
              filterDataset(selectedLayer, function(ok) {
                if (ok) {
                  highlightLayer(selectedLayer);
                }
              });
            } else {
              if (selectedLayer != $scope.lastGeoJSONLayerClicked) {
                // clicked on different feature --> unhighlight previous layer, highlight current layer
                filterDataset(selectedLayer, function(ok) {
                  if (ok) {
                    highlightLayer(selectedLayer);
                    unhighlightLayer($scope.lastGeoJSONLayerClicked, leafletGeoJSON);
                  }
                });
              } else {
                // clicking on same feature
                if (selectedLayer.highlighted) {
                  clearDatasetFilter(function(ok) {
                    if (ok) {
                      unhighlightLayer(selectedLayer, leafletGeoJSON);
                    }
                  });
                } else {
                  filterDataset(selectedLayer, function(ok) {
                    if (ok) {
                      highlightLayer(selectedLayer);
                    }
                  })
                }
              }
            }
            // update last layer clicked
            $scope.lastGeoJSONLayerClicked = selectedLayer;
          }, singleClickSuppressionThreshold);
        }
      });

      // Choropleth Mouseover Tooltip Effect

      function mouseoverFeature(event, leafletEvent) {
        var feature = leafletEvent.target.feature;
        var value = feature.properties[attr];
        // TODO: mouseover popups
      }

      $scope.$on('leafletDirectiveMap.geojsonMouseover', function(event, leafletEvent) {
        mouseoverFeature(event, leafletEvent);
      });

      $scope.$watch('regions', function(geojsonData){
        if (!geojsonData) return;
        updateGeojson(geojsonData);
      });
    }
  }
});
