(function() {
  'use strict';

  var AGGREGATE_VALUE_PROPERTY_NAME = '__SOCRATA_FILTERED_VALUE__';
  var MAXIMUM_NUMBER_OF_CLASSES_ALLOWED = 7;
  // if the number of unique values in the dataset is <= the threshold, displays
  // 1 color for each unique value, and labels them as such in the legend.
  var CLASS_BREAK_THRESHOLD = 6;
  
  angular.module('dataCards.services').factory('ChoroplethVisualizationService', function() {

    function ChoroplethVisualization() {

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


    /*******************
    * Data calculation *
    *******************/

    ChoroplethVisualization.prototype.calculateDataClassBreaks = function(geojsonAggregateData, propertyName) {

      function extractGeojsonValues(geojsonAggregateData, propertyName) {
        var data = [];
        _.each(geojsonAggregateData.features, function(feature){
          if (!_.isDefined(feature) || !feature.hasOwnProperty('properties')) {
            return [];
          }
          if (!feature.properties.hasOwnProperty(propertyName) ||
              !_.isDefined(feature.properties[propertyName])) {
            return;
          }
          data.push(feature.properties[propertyName]);
        });
        return data;
      }

      function calculateNumberOfClasses(numberOfPossibleBreaks) {
        var nearestEvenNumberOfPossibleBreaks = numberOfPossibleBreaks
                                              - (numberOfPossibleBreaks % 2);;
        var maximumNumberOfClasses = nearestEvenNumberOfPossibleBreaks / 2;
        if (maximumNumberOfClasses % 2 === 0) {
          maximumNumberOfClasses -= 1;
        }
        return _.min([maximumNumberOfClasses, MAXIMUM_NUMBER_OF_CLASSES_ALLOWED]);
      }

      function createClassBreaks(options) {
        var classBreaks;
        var minVal = _.min(options.data);
        var maxVal = _.max(options.data);

        options.method = options.method.toLowerCase() || 'jenks';

        switch(options.method) {
          case 'jenks':
            classBreaks = ss['jenks'](options.data, options.numberOfClasses);
            break;
          case 'quantile':
            classBreaks = ss['quantile'](options.data, options.p);
          case 'values':
            classBreaks = d3.scale.linear().domain([minVal, maxVal]).nice().ticks(_.min([options.numberOfClasses, 4]));
            // include min and max back into d3 scale, if #nice truncates them
            if (_.min(classBreaks) > minVal) {
              classBreaks.unshift(minVal);
            }
            if (_.max(classBreaks) < maxVal) {
              classBreaks.push(maxVal);
            }
            break;
          default:
            throw new Error('Cannot calculate data class breaks using unsupported method "' + options.method + '".');
        }
        return _.uniq(classBreaks);
      }

      var values = extractGeojsonValues(geojsonAggregateData, propertyName);
      var uniqueValues = _.uniq(values);
      var numberOfPossibleBreaks = uniqueValues.length - 1;
      var classBreaks = null;

      if (values.length == 0) {
        throw new Error('Cannot calculate data class breaks with no values.');
      }

      if (numberOfPossibleBreaks <= CLASS_BREAK_THRESHOLD) {
        // for such small values, jenks does not make sense (produces duplicate values).
        // use equal interval in such cases.
        classBreaks = createClassBreaks({
          method: 'values',
          data: values,
          numberOfClasses: values.length
        });
      } else {
        classBreaks = createClassBreaks({
          method: 'jenks',
          data: values,
          numberOfClasses: calculateNumberOfClasses(numberOfPossibleBreaks)
        });
      }

      return classBreaks;
    };


    /********************
    * Style calculation *
    ********************/

    ChoroplethVisualization.prototype.updateMultiColorScale = function(colorClass, classBreaks) {
      var colorRange;
      var lightnessCorrection;
      var bezierColorInterpolation;

      if (!classBreaks) {
        throw new Error('Invalid class breaks');
      }
      if (classBreaks.length < 2) {
        throw new Error('ChoroplethVisualization.updateMultiColorScale is only valid for choropleths with >= 2 class breaks.');
      }

      switch (colorClass.toLowerCase()) {
        case 'diverging':
          colorRange = this.divergingColors;
          lightnessCorrection = false;
          bezierColorInterpolation = false;
          break;
        case 'qualitative':
          if (classBreaks.length > 12) {
            throw new Error('ChoroplethVisualization.updateMultiColorScale cannot use qualitative scale for > 12 class breaks.');
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
          throw new Error('ChoroplethVisualization.updateMultiColorScale is only valid for diverging, qualitative or sequential color classes.');
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

    ChoroplethVisualization.prototype.sampleColorRange = function(samples) {
      var step = 1 / (samples - 1);
      var position = 0;
      var colors = [];
      var i;

      if (samples === 0) {
        throw new Error('Cannot divide color range into zero samples.');
      }

      for (i = 0; i < samples - 1; i++) {
        colors.push(this.colors(position + (i * step)));
      }

      return colors;
    }

    ChoroplethVisualization.prototype.fillColor = function(fillClass, feature, highlighted) {

      // TODO: Factor out the requirement that this.scale (and thus, class breaks) have already
      // been computed by the first time this function is called.

      if (this.scale === null) {
        throw new Error('ChoroplethVisualization.fillColor requires a valid scale to be set by updateMultiColorScale before use.')
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

    ChoroplethVisualization.prototype.strokeColor = function(fillClass, feature, highlighted) {
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

    ChoroplethVisualization.prototype.strokeWidth = function(fillClass, feature, highlighted) {
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

    ChoroplethVisualization.prototype.getStyleFn = function(fillClass, featureIsHighlighted) {
      var visualization = this;
      if (fillClass == 'none') {
        return function(feature) {
          var highlighted = featureIsHighlighted(feature);
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
          var highlighted = featureIsHighlighted(feature);
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
            fillColor: visualization.fillColor(fillClass, feature, feature.properties.__SOCRATA_FEATURE_HIGHLIGHTED__),
            color: visualization.strokeColor(fillClass, feature, feature.properties.__SOCRATA_FEATURE_HIGHLIGHTED__),
            weight: visualization.strokeWidth(fillClass, feature, feature.properties.__SOCRATA_FEATURE_HIGHLIGHTED__),
            opacity: fillClass == 'none' ? 1 : 0.8,
            dashArray: 0,
            fillOpacity: fillClass == 'none' ? 1 : 0.8
          };
        };
      }
    };

    var choroplethVisualization = new ChoroplethVisualization();

    return {
      getChoroplethVisualization: function() {
        return choroplethVisualization;
      }
    };

  });

})();
