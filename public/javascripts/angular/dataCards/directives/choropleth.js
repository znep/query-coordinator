(function() {
  'use strict';

  angular.module('dataCards.directives').directive('choropleth',
    ['AngularRxExtensions', 'ChoroplethHelpers', 'leafletBoundsHelpers', '$log', '$timeout', 'numberFormatter',
    function(AngularRxExtensions, ChoroplethHelpers, leafletBoundsHelpers, $log, $timeout, numberFormatter) {

    var LEAFLET_DEFAULT_CENTER = [47.609895, -122.330259];
    var LEAFLET_DEFAULT_ZOOM = 1;
    // AGGREGATE_VALUE_PROPERTY_NAME is an internal implementation name for the aggregate data
    // value we will display on the choropleth. This name is global, constant and has been
    // chosen so that it is unlikely to collide with any user-defined property on the
    // GeoJSON object we receive.
    var AGGREGATE_VALUE_PROPERTY_NAME = '__SOCRATA_FILTERED_VALUE__';
    var UNFILTERED_VALUE_PROPERTY_NAME = '__SOCRATA_UNFILTERED_VALUE__';
    var HUMAN_READABLE_PROPERTY_NAME = '__SOCRATA_HUMAN_READABLE_NAME__';
    var INTERNAL_DATASET_FEATURE_ID = '_feature_id';
    var NULL_VALUE_LABEL = '(No Value)';

    // if the number of unique values in the dataset is <= the threshold, displays
    // 1 color for each unique value, and labels them as such in the legend.
    var threshold = 6;

    // Utility functions.
    var numberOfClasses = function(values) {
      // handles numberOfClasses in Jenks (implemented for _.uniq(values).length > 6)
      var numPossibleBreaks = _.uniq(values).length;
      if (numPossibleBreaks <= threshold) {
        throw new Error("[Choropleth] Why are you calling numberOfClasses when # unique values <= " + threshold + "?");
      } else {
        var evenPossibleBreaks = numPossibleBreaks - (numPossibleBreaks % 2);
        var maxNumClasses = evenPossibleBreaks / 2;
      }
      return _.min([oddNumbered(maxNumClasses), 7]);
    };

    var oddNumbered = function(num) {
      if (num % 2 == 0) {
        return num - 1;
      } else {
        return num;
      }
    };

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
    };


    /* Choropleth styles */

    function DataVisualization() {

      // The scale from which individual fill colors are derived.
      this.scale = null;

      // The colors assigned to class breaks.
      this.colors = null;

      // Default colors.
      this.nullColor = '#ddd';
      this.defaultSingleColor = 'teal';
      this.defaultStrokeColor = 'white';
      this.defaultHighlightColor = '#debb1e';

      // Color classes.
      this.defaultColorClass = 'sequential';
      this.sequentialColors = ['#e4eef0', '#408499'],
      this.divergingColors = ['brown','lightyellow','teal'],
      this.qualitativeColors = {
        2: ["#8dd3c7","#ffffb3"],
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
      };

    };

    DataVisualization.prototype.updateMultiColorScale = function(colorClass, classBreaks) {

          var colorRange;
          var lightnessCorrection;
          var bezierColorInterpolation;

          if (!classBreaks) {
            throw new Error('Invalid class breaks');
          }
          if (classBreaks.length < 2) {
            throw new Error('DataVisualization.updateMultiColorScale is only valid for choropleths with >= 2 class breaks.');
          }

          switch (colorClass.toLowerCase()) {
            case 'diverging':
              colorRange = this.divergingColors;
              lightnessCorrection = false;
              bezierColorInterpolation = false;
              break;
            case 'qualitative':
              if (classBreaks.length > 12) {
                throw new Error('DataVisualization.updateMultiColorScale cannot use qualitative scale for > 12 class breaks.');
              }
              colorRange = this.qualitativeColors[classBreaks.length];
              lightnessCorrection = false;
              bezierColorInterpolation = false;
              break;
            case 'sequential':
              colorRange = this.sequentialColors;
              lightnessCorrection = true;
              bezierColorInterpolation = true;
              break;
            default:
              throw new Error('DataVisualization.updateMultiColorScale is only valid for diverging, qualitative or sequential color classes.');
          }

          if (bezierColorInterpolation) {
            this.colors = chroma.interpolate.bezier(colorRange);
          } else {
            this.colors = colorRange;
          }

          this.scale = new chroma.scale(this.colors)
            .domain(classBreaks)
            .correctLightness(lightnessCorrection)
            // use LAB color space to approximate perceptual brightness,
            // bezier interpolation, and auto-correct for color brightness.
            // See more: https://vis4.net/blog/posts/mastering-multi-hued-color-scales/
            .mode('lab');

    };

    DataVisualization.prototype.sampleColorRange = function(samples) {
      if (samples === 0) {
        throw new Error('Cannot divide color range into zero samples.');
      }
      var step = 1 / (samples - 1);
      var position = 0;
      var colors = [];
      var i;
      for (i = 0; i < samples - 1; i++) {
        colors.push(this.colors(position + (i * step)));
      }
      console.log(colors);
      return colors;
    }

    DataVisualization.prototype.fillColor = function(fillClass, feature, highlighted) {

      if (this.scale === null) {
        throw new Error('DataVisualization.fillColor requires a valid scale to be set by updateMultiColorScale before use.')
      }

      if (!feature.properties || !feature.properties[AGGREGATE_VALUE_PROPERTY_NAME]) {
        return this.nullColor;
      } else {
        if (highlighted) {
          if (fillClass == 'none') {
            return 'transparent';
          } else if (fillClass == 'single') {
            return this.defaultSingleColor;
          } else if (fillClass == 'multi') {
            var value = Number(feature.properties[AGGREGATE_VALUE_PROPERTY_NAME]);
            return this.scale(value).hex();
          } else {
            throw new Error("Invalid fillClass on #fill: " + fillClass);
          }
        } else {
          if (fillClass == 'none') {
            return 'transparent';
          } else if (fillClass == 'single') {
            return this.defaultSingleColor;
          } else if (fillClass == 'multi') {
            var value = Number(feature.properties[AGGREGATE_VALUE_PROPERTY_NAME]);
            return this.scale(value).hex();
          } else {
            throw new Error("Invalid fillClass on #fill: " + fillClass);
          }
        }
      }
    };

    DataVisualization.prototype.strokeColor = function(fillClass, feature, highlighted) {
      if (feature.geometry.type != "LineString" && feature.geometry.type != "MultiLineString") {
        if (highlighted) {
          return this.defaultHighlightColor;
        } else {
          return this.defaultStrokeColor;
        }
      } else {
        if (!feature.properties || !feature.properties[AGGREGATE_VALUE_PROPERTY_NAME]) {
          return this.nullColor;
        } else {
          if (highlighted) {
            if (fillClass == 'none') {
              return this.defaultHighlightColor;
            } else if (fillClass == 'single') {
              return this.defaultHighlightColor;
            } else if (fillClass == 'multi') {
              return this.defaultHighlightColor;
            } else {
              throw new Error("Invalid fillClass on #fill: " + fillClass);
            }
          } else {
            if (fillClass == 'none') {
              return 'black';
            } else if (fillClass == 'single') {
              return this.defaultSingleColor;
            } else if (fillClass == 'multi') {
              // for LineString or MultiLineString, strokeColor is the same as a feature's 'fill color'
              return this.fillColor(fillClass, feature, fillClass);
            } else {
              throw new Error("Invalid fillClass on #fill: " + fillClass);
            }
          }
        }
      }
    };

    DataVisualization.prototype.strokeWidth = function(fillClass, feature, highlighted) {
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

    DataVisualization.prototype.getStyleFn = function(fillClass, highlighted) {
      var highlighted = false;
      var visualization = this;
      if (fillClass == 'none') {
        return function(feature) {
          return {
            fillColor: visualization.fillColor(fillClass, feature, highlighted),
            color: visualization.strokeColor(fillClass, feature, highlighted),
            weight: visualization.strokeWidth(fillClass, feature, highlighted),
            opacity: fillClass == 'none' ? 1 : 0.8,
            dashArray: 0,
            fillOpacity: fillClass == 'none' ? 1 : 0.8
          };
        };
      } else if (fillClass == 'single') {
        return function(feature) {
          return {
            fillColor: visualization.fillColor(fillClass, feature, highlighted),
            color: visualization.strokeColor(fillClass, feature, highlighted),
            weight: visualization.strokeWidth(fillClass, feature, highlighted),
            opacity: fillClass == 'none' ? 1 : 0.8,
            dashArray: 0,
            fillOpacity: fillClass == 'none' ? 1 : 0.8
          };
        };
      } else if (fillClass == 'multi') {
        return function(feature) {
          return {
            fillColor: visualization.fillColor(fillClass, feature, highlighted),
            color: visualization.strokeColor(fillClass, feature, highlighted),
            weight: visualization.strokeWidth(fillClass, feature, highlighted),
            opacity: fillClass == 'none' ? 1 : 0.8,
            dashArray: 0,
            fillOpacity: fillClass == 'none' ? 1 : 0.8
          };
        };
      }
    };




    return {
      restrict: 'E',
      replace: true,
      scope: {
        'baseLayerUrl': '=',
        'geojsonAggregateData': '=',
        'rowDisplayUnit': '=?'
      },
      //template: '<div class="choropleth-map-container"><leaflet class="choropleth-map" bounds="bounds" defaults="defaults" geojson="geojson" legend="legend"></leaflet></div>',\
      template: '<div><div class="choropleth-map-container"></div><div class="choropleth-legend-container modern-legend"></div></div>',
  /*    controller: function($scope) {
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
          scrollWheelZoom: false,
          attributionControl: false,
          keyboard: false
        };
        $scope.bounds = {}; // Initial bounds are empty. Consider caching a sensible bounds on the card data so we can
                            // show a sensible default view while we get the geojson. However, a spinner might be a better
                            // idea.

      },*/
      link: function($scope, element) {

        AngularRxExtensions.install($scope);

        var options = {
          attributionControl: false,
          center: LEAFLET_DEFAULT_CENTER,
          keyboard: false,
          scrollWheelZoom: false,
          tileLayerOptions: {
            opacity: 0.15,
            detectRetina: true,
            reuseTiles: true
          },
          zoom: LEAFLET_DEFAULT_ZOOM,
          zoomControlPosition: 'topleft'
        };

        var map = L.map(element.find('.choropleth-map-container')[0], options);

        // Keep track of the geojson layer so that we can remove it cleanly. Every
        // redraw of the map forces us to remove the layer entirely because there
        // is no way to mutate already-rendered geojson objects.
        var geojsonBaseLayer = null;

        // Watch for first render so we know whether or not to update the center/bounds.
        // (We don't update the center or the bounds if the choropleth has already been
        // rendered so that we can retain potential panning and zooming done by the user.
        var firstRender = true;

        var visualization = new DataVisualization();







        var highlightedFeatures = {};


        function setTileLayer(url, options) {
          L.tileLayer(url, options).addTo(map);
        }

        function setGeojsonData(data, options) {
          if (geojsonBaseLayer !== null) {
            map.removeLayer(geojsonBaseLayer);
          }
          geojsonBaseLayer = L.geoJson(data, options);
          geojsonBaseLayer.addTo(map);
        }

        function updateBounds(bounds) {
          map.fitBounds(leafletBoundsHelpers.createLeafletBounds(bounds));
        }

        function calculateGeojsonBounds(data) {
          return leafletBoundsHelpers.createBoundsFromArray(ChoroplethHelpers.createBoundsArray(data));
        };

        function updateLegend(classBreaks, colors) {


          function bigNumTickFormatter(val) {
            // used if ss.standard_deviation(classBreaks) > 10
            // val = a x 10^b (a: coefficient, b: exponent);
            if (val === 0) return 0;
            var exponent = Math.floor(Math.log(Math.abs(val))/Math.LN10);
            var coefficient = val / Math.pow(10, exponent);
            var isMultipleOf10 = coefficient % 1 == 0;
            if (isMultipleOf10) {
              var numNonzeroDigits = coefficient.toString().length;
              var formattedNum = numberFormatter.formatNumber(val, {
                fixedPrecision: 0,
                maxLength: _.min([numNonzeroDigits, 3])
              });
            } else {
              var numNonzeroDigits = coefficient.toString().length - 1;
              var formattedNum = numberFormatter.formatNumber(val, {
                maxLength: _.min([numNonzeroDigits, 3])
              });
            }
            return formattedNum;
          }

          var legendLabelColorHeight = function(colorIndex) {
            var minVal = _.min(classBreaks);
            var maxVal = _.max(classBreaks);
            var percentOfClassbreakRange = (classBreaks[colorIndex + 1] - classBreaks[colorIndex]) / (maxVal - minVal);
            return percentOfClassbreakRange * height;
          };



          var className = 'modern-legend';
          var position = 'bottomright';

          if (colors.length === 0) {
            // short-circuit d3's exit selections and simply remove the entire legend vs removing individual components.
            d3.select(element[0]).select('.' + className).remove();
            return;
          }
console.log(classBreaks, colors);
          if (colors.length !== classBreaks.length - 1) {
            $log.error('[AngularJS - Leaflet] The number of legend colors should be 1 less than the number of class breaks: ', classBreaks);
          }

          // draw the legend on the map

          var minBreak = classBreaks[0];
          var maxBreak = classBreaks[classBreaks.length - 1];

          var colorWidth = 15;
          var margin = {top: 0, right: 0, bottom: 0, left: 0};
          // margins are not needed due to transparent legend background.
          // keep in case this spec changes.
          var height = 250 - margin.top - margin.bottom;
          var width = colorWidth - margin.left - margin.right;

          var legendSelection = d3.select(element.find('.choropleth-legend-container')[0]).data([{colors: colors, classBreaks: classBreaks}]);

          legendSelection.enter().
            append('div').
            classed(className, function() {
              return true;
            }).
            classed(position, true);

          var svg = legendSelection.selectAll('svg').data([{colors: colors, classBreaks: classBreaks}]);

          svg.enter().
            append('svg').
            attr('height', height + margin.top + margin.bottom).
            attr('width', width + margin.left + margin.right).
            append('g').
            attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          if (classBreaks.length == 1) {
            // if there is just 1 value, make it range from 0 to that value
            var singleClassBreak = classBreaks[0];
            classBreaks = [_.min([0, singleClassBreak]), _.max([0, singleClassBreak])];
            var numTicks = 1;
          } else {
            var numTicks = 4;
          }

          var yTickScale = d3.scale.linear().range([height-1, 1]);
          var yLabelScale = d3.scale.linear().range([height, 0]);

          var yAxis = d3.svg.axis().
                        scale(yTickScale).
                        ticks(numTicks).
                        orient('left');

          var yTickScaleDomain = yTickScale.domain([minBreak, maxBreak]);
          var yLabelScaleDomain = yLabelScale.domain([minBreak, maxBreak]);

          var isLargeRange = ss.standard_deviation(classBreaks) > 10;

          if (isLargeRange) {
            // d3 quirk: using a #tickFormat formatter that just returns the value
            // gives unexpected results due to floating point math.
            // We want to just return the value for "small-ranged" data.
            // --> do not call a tickFormatter on yAxis if range is small.
            yAxis.tickFormat(bigNumTickFormatter);

            // Due to similar issues, d3's scale#nice method also has
            // floating point math issues.
            yTickScaleDomain.nice();
            yLabelScaleDomain.nice();
          }

          // include min and max back into d3 scale, if #nice truncates them
          if (_.min(classBreaks) > minBreak) classBreaks.unshift(minBreak);
          if (_.max(classBreaks) < maxBreak) classBreaks.push(maxBreak);

          // update first and last class breaks to nice y domain
          classBreaks[0] = yTickScale.domain()[0];
          classBreaks[classBreaks.length - 1] = yTickScale.domain()[1];

          var labels = svg.selectAll('.labels').data([classBreaks]);

          labels.enter().
            append('g').
            attr('class', 'labels');

          labels.
            call(yAxis).
            // remove axis line that comes with d3 axis
            select('path').
            remove();

          labels.exit().remove();

          // draw legend colors

          var rects = svg.selectAll('.color').data(colors);

          rects.enter().
            append('rect');

          rects.
            attr('class', 'color').
            attr('width', colorWidth).
            attr('height', function(c, i){
              return legendLabelColorHeight(i);
            }).
            attr('y', function(c, i){
              return yLabelScale(classBreaks[i+1]);
            }).
            style('fill', function(color){ return color; });

          if (colors.length > 1) {
            if (isLargeRange) {
              rects.
                attr('data-flyout-text', function(color, i) {
                  return bigNumTickFormatter(classBreaks[i]) + ' - ' + bigNumTickFormatter(classBreaks[i+1]);
                });
            } else {
              rects.
                attr('data-flyout-text', function(color, i) {
                  return classBreaks[i] + ' - ' + classBreaks[i+1];
                });
            }
          } else {
            if (isLargeRange) {
              rects.
                attr('data-flyout-text', bigNumTickFormatter(singleClassBreak));
            } else {
              rects.
                attr('data-flyout-text', singleClassBreak);
            }
          }

          rects.exit().
            remove();

          // set up legend color flyouts
          $(element).find('.modern-legend').flyout({
            selector: '.color',
            direction: 'horizontal',
            style: 'table',
            parent: document.body,
            interact: true,
            overflowParent: true,
            inset: {
              horizontal: -3,
              vertical: 2
            },
            html: function($target, $head, options, $element) {
              // do not use $target.data('flyout-text') due to conflicts with jQuery caching .data() results
              // [see http://stackoverflow.com/questions/8707226/jquery-data-does-not-work-but-attrdata-itemname-does]
              return $target.attr('data-flyout-text');
            }
          });

        }
/*
      var updateLegend = function(classBreaks, colors) {
        $scope.legend = {
          position: defaultLegendPos,
          colors: classBreaks ? colors : [],
          classBreaks: classBreaks
        };
      };
*/
        var calculateDataClassBreaks = function(values) {
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
            classBreaks = ChoroplethHelpers.createClassBreaks({
              method: 'niceEqualInterval',
              data: values,
              numberOfClasses: values.length
            });
          } else {
            classBreaks = ChoroplethHelpers.createClassBreaks({
              method: 'jenks',
              data: values,
              numberOfClasses: numberOfClasses(values)
            });
          }
          return classBreaks;
        };

        function onEachFeature(feature, layer) {
          layer.on({
            mouseover: onFeatureMouseOver,
            mouseout: onFeatureMouseOut,
            mousemove: onFeatureMouseMove,
            click: onFeatureMouseDown
          });
        }














      /* Dataset filtering */

      // Send the toggle filter event up the scope to the parent, where it can
      // be handled by the model.
      var filterDataset = function(selectedFeature, callback) {
        var featureId = selectedFeature.properties[INTERNAL_DATASET_FEATURE_ID];
        highlightFeature(featureId);
        $scope.$emit('dataset-filter:choropleth');
        $scope.$emit(
          'toggle-dataset-filter:choropleth',
          selectedFeature,
          callback);
      };

      // Send the toggle filter event up the scope to the parent, where it can
      // be handled by the model.
      var clearDatasetFilter = function(selectedFeature, callback) {
        var featureId = selectedFeature.properties[INTERNAL_DATASET_FEATURE_ID];
        unhighlightFeature(featureId);
        $scope.$emit('dataset-filter-clear:choropleth');
        $scope.$emit(
          'toggle-dataset-filter:choropleth',
          selectedFeature,
          callback);
      };

      /* Region click handling */

      var singleClickSuppressionThreshold = 200;
      var doubleClickThreshold = 400;
      var lastClick = 0;
      var lastClickTimeout = null;

      function onFeatureMouseDown(e) {

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
            var featureId = e.target.feature.properties[INTERNAL_DATASET_FEATURE_ID];
            // single click --> filters dataset
            if (featureIsHighlighted(featureId)) {
              clearDatasetFilter(e.target.feature, function(ok) {
                if (ok) {
                  // TODO: Do something?
                }
              });
            } else {
              filterDataset(e.target.feature, function(ok) {
                if (ok) {
                  // TODO: Do something?
                }
              });
            }
          }, singleClickSuppressionThreshold);
        }
      };










        var clearAllBrighten = function(layer) {
          _.each(layer._map._layers, function(l) {
            if (_.isPresent(l.feature)) {
              var featureId = l.feature.properties[INTERNAL_DATASET_FEATURE_ID];
              if (!featureIsHighlighted(featureId)) {
                l.setStyle(unbrightenFeatureStyleObject);
              }
            }
          });
        }

        var mouseoverBrighten = function(e) {
          var layer = e.target;

          // IE HACK: Attempt to fix the mouseout event not being reliable.
          if (L.Browser.ie) {
            clearAllBrighten(layer);
          }
          var featureId = layer.feature.properties[INTERNAL_DATASET_FEATURE_ID];
          if (!featureIsHighlighted(featureId)) {
            layer.setStyle(brightenFeatureStyleObject);
            layer.bringToFront();
          }
        };

        var mouseoutUnbrighten = function(e) {
          var layer = e.target;
          var featureId = layer.feature.properties[INTERNAL_DATASET_FEATURE_ID];
          if (!featureIsHighlighted(featureId)) {
            layer.setStyle(unbrightenFeatureStyleObject);
            layer.bringToBack();
          }
        };










      var unit = function(val) {
        if (typeof val != 'number') {
          return '';
        } else {
          if (val != 1) {
            return ' ' + $scope.rowDisplayUnit.pluralize();
          } else {
            return ' ' + $scope.rowDisplayUnit;
          }
        }
      };


      var positionTooltip = function(e){

        // Note: 'this' is a jQuery object.

        var bodyWidth = document.body.clientWidth;
        var cursorTop = e.originalEvent.pageY;
        var cursorLeft = e.originalEvent.pageX;
        var flyoutHeight = this.outerHeight(true) + 2;
        var flyoutWidth = this.outerWidth(true) + 2;
        var marginX = this.outerWidth(true) - this.width();
        var arrowMargin = 15;
        var cursorArrowOffset = 5; // the "space" that appears between the pointer finger and the flyout arrow
        var arrowDisplacement = arrowMargin - cursorArrowOffset;

        // IE HACK: Move the tooltip further from to stop interaction.
        if (L.Browser.ie) {
          arrowMargin += 10;
        }

        this.css("top", (cursorTop - flyoutHeight - arrowMargin));

        // spec: if the choropleth flyout approaches the edge of the screen,
        // keep the flyout fully displayed on the screen.
        // adjust the flyout arrow horizontally to track the mouse move.
        // flip the orientation of the arrow if you are over halfway across the flyout width.

        var orientationIsRight = cursorLeft > this.offset().left + this.width()/2;
        var leftOffset = cursorLeft - marginX / 2 + arrowDisplacement;
        var maxLeftOffset = bodyWidth - flyoutWidth + cursorArrowOffset;

        var $flyoutArrow = this.find('.flyout-arrow');

        if (orientationIsRight) {
          leftOffset -= arrowDisplacement;
          $flyoutArrow.removeClass('left').addClass('right');
        } else {
          $flyoutArrow.removeClass('right').addClass('left');
        }

        if (leftOffset < maxLeftOffset) {
          this.css('left', leftOffset);
          $flyoutArrow.css('left', 0);
        } else {
          this.css('left', maxLeftOffset);
          $flyoutArrow.css('left', leftOffset - maxLeftOffset);
        }
      };

      var populateTooltip = function(contents) {
        var htmlContent = '', valClass = '';
        for (var i = 0; i < contents.length; i++) {
          var content = contents[i];
          htmlContent += '<div class="flyout-row">' +
            '<span class="flyout-cell">' + content.title + '</span>' +
            '<span class="flyout-cell ' + (content.italicize ? 'italicize' : '') + '">' + content.body + '</span>' +
          '</div>';
        }
        this.children('.flyout-content').html(htmlContent);
      }

      var highlightFeature = function(featureId) {
        //if (!$scope.highlightedFeatures.hasOwnProperty(featureId)) {
        //  $scope.highlightedFeatures[featureId] = true;
        //}
        // TEMPORARILY OVERRIDING THE ABOVE FOR MVP:
        // Only allow one item to be highlighted at a time, so we just replace the
        // highlighted cache instead:
        highlightedFeatures = {};
        highlightedFeatures[featureId] = true;
      };

      var unhighlightFeature = function(featureId) {
        if (highlightedFeatures.hasOwnProperty(featureId)) {
          delete highlightedFeatures[featureId];
        }
      };

      var featureIsHighlighted = function(featureId) {
        return highlightedFeatures.hasOwnProperty(featureId);
      };



      var $tooltip;

      var initializeChoroFlyout = function() {
        $tooltip = $('#choro-flyout');

        if ($tooltip.length == 0) {
          var html = '<div class="flyout nointeract flyout-chart top" id="choro-flyout">' +
              '<div class="flyout-arrow left"></div>' +
              '<div class="flyout-title"></div>' +
              '<div class="flyout-content">' +
              '</div>' +
            '</div>'
          $('body').append(html);
          $tooltip = $('#choro-flyout');
          $tooltip.hide();

          $tooltip
            .mousemove(function(e) {
                positionTooltip.call($tooltip, e);
            })
            .mouseout(function() {
              //remove bug where tooltip doesn't disappear when hovering on map
              if ($("#choro-flyout:hover").length == 0) {
                $tooltip.hide();
              }
            });
        }

        return $tooltip;
      };

        var brightenFeatureStyleObject = {
          weight: 4
        };

        var unbrightenFeatureStyleObject = {
          weight: 1
        };


        function onFeatureMouseOver(e) {
          // NOTE: one cannot attach data-attributes from a feature's geojson properties to their associated SVG path element via leaflet easily.
          // as a result, much of the $.flyout behavior must be custom-implemented, because $.flyout's #html option depends upon
          // the data being readily available.

          // initialize choro flyout element, can disappear on card collapse.
          $tooltip = initializeChoroFlyout();
          var layer = e.target;
          var feature = layer.feature;
          var featureHumanReadableName = feature.properties[HUMAN_READABLE_PROPERTY_NAME];
          var value = feature.properties[AGGREGATE_VALUE_PROPERTY_NAME];
          var unfilteredValue = feature.properties[UNFILTERED_VALUE_PROPERTY_NAME];
          var filteredValue = 0;
          var featureIsHighlighted = (value !== unfilteredValue);
          var unfilteredValueIsUndefined = false;
          var unfilteredValueDisplay;
          var filteredValueDisplay;
          var contents = [];

          $tooltip.removeClass('undefined').removeClass('filtered');

          if (typeof value != 'number') {
            filteredValueDisplay = 0;
            // filtered value should show as 0, if null/undefined.
            filteredValue = 0;
          } else {
            filteredValueDisplay = $.toHumaneNumber(value);
          }

          if (typeof unfilteredValue != 'number') {
            unfilteredValueDisplay = NULL_VALUE_LABEL;
            unfilteredValueIsUndefined = true;
          } else {
            unfilteredValueDisplay = $.toHumaneNumber(unfilteredValue);
          }

          if (featureHumanReadableName) {
            $tooltip.find('.flyout-title').text(featureHumanReadableName.capitaliseEachWord());
          }

          contents = [{ title: 'Total', body: unfilteredValueDisplay + unit(unfilteredValue), italicize: unfilteredValueIsUndefined }];

          if (featureIsHighlighted) {
            contents.push({ title: 'Filtered Amount', body: filteredValueDisplay + unit(filteredValue) });
            $tooltip.addClass('filtered');
          }

          populateTooltip.call($tooltip, contents);

          //initializeFeatureEventHandlers();
          mouseoverBrighten(e);

        }

        function onFeatureMouseOut(e) {
          if (_.isEmpty($('#choro-flyout:hover'))) {
            $tooltip.hide();
          }
          mouseoutUnbrighten(e);
        }


        function onFeatureMouseMove(e) {
          $tooltip.show();
          positionTooltip.call($tooltip, e);
        }












        //$scope.$watch('baseLayerUrl', function(baseLayerUrl) {
        //  setTileLayer(baseLayerUrl, { attribution: false });
        //});

        Rx.Observable.subscribeLatest(
          $scope.observe('baseLayerUrl'),
          element.observeDimensions(),
          $scope.observe('geojsonAggregateData'),
          function(baseLayerUrl, dimensions, geojsonAggregateData) {
console.log(baseLayerUrl);
            if (_.isDefined(baseLayerUrl)) {

              setTileLayer(baseLayerUrl, { attribution: false });

              map.invalidateSize();

              if (_.isDefined(geojsonAggregateData)) {

              // Only update bounds on the first render so we can persist
              // users' panning and zooming.
              if (firstRender) {
                var bounds = calculateGeojsonBounds(geojsonAggregateData);
                updateBounds(bounds);
                firstRender = false;
              }

              var values = ChoroplethHelpers.getGeojsonValues(geojsonAggregateData, UNFILTERED_VALUE_PROPERTY_NAME);
              var classBreaks = calculateDataClassBreaks(values);

              var fillType = 'single';

              if (classBreaks.length > 1) {
                visualization.updateMultiColorScale(visualization.defaultColorClass, classBreaks);
                fillType = 'multi';
              }


              updateLegend(classBreaks, visualization.sampleColorRange(classBreaks.length));

              var geojsonOptions = {
                onEachFeature: onEachFeature,
                style: visualization.getStyleFn(fillType)
              };

              setGeojsonData(geojsonAggregateData, geojsonOptions);

            }

          }

        });


      }

    }
  }]);

})();