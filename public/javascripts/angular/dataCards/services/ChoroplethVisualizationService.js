(function() {
  'use strict';

  function ChoroplethVisualizationService(Constants) {

    function ChoroplethVisualization() {

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
        return _.min([maximumNumberOfClasses, Constants.get('MAXIMUM_NUMBER_OF_CLASSES_ALLOWED')]);
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

      // If the number of unique values in the dataset is less than or equal to
      // the threshold, display 1 color for each unique value, and label them as such in the legend.
      if (numberOfPossibleBreaks <= Constants.get('CLASS_BREAK_THRESHOLD')) {
        classBreaks = createClassBreaks({
          method: 'values',
          data: values,
          numberOfClasses: values.length
        });
      // Otherwise, calculate a dynamic number of classes for Jenks.
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

    ChoroplethVisualization.prototype.calculateColoringParameters = function(colorClass, classBreaks) {
      var colorRange;
      var lightnessCorrection;
      var bezierColorInterpolation;
      var colorClasses;
      var scale;

      if (!classBreaks) {
        throw new Error('Cannot calculate coloring parameters with nvalid class breaks.');
      }

      switch (colorClass.toLowerCase()) {
        case 'diverging':
          colorClasses = this.divergingColors;
          lightnessCorrection = false;
          bezierColorInterpolation = false;
          break;
        case 'qualitative':
          if (classBreaks.length > 12) {
            throw new Error('Cannot calculate qualitative coloring parameters for more than 12 class breaks.');
          }
          colorClasses = this.qualitativeColors[classBreaks.length];
          lightnessCorrection = false;
          bezierColorInterpolation = false;
          break;
        case 'sequential':
          colorClasses = this.sequentialColors;
          lightnessCorrection = true;
          bezierColorInterpolation = true;
          break;
        default:
          throw new Error('Cannot calculate coloring parameters for invalid color class "' + colorClass + '".');
      }

      if (bezierColorInterpolation) {
        colorClasses = chroma.interpolate.bezier(colorClasses);
      }

      scale = new chroma.scale(colorClasses)
        .domain(classBreaks)
        .correctLightness(lightnessCorrection)
        // use LAB color space to approximate perceptual brightness,
        // bezier interpolation, and auto-correct for color brightness.
        // See more: https://vis4.net/blog/posts/mastering-multi-hued-color-scales/
        .mode('lab');

      return { scale: scale, classes: colorClasses };
    };

    ChoroplethVisualization.prototype.sampleColorRange = function(colorData, samples) {
      var adjustedSamples = samples - 1;
      var step;
      var position = 0;
      var colors = [];
      var i;

      if (adjustedSamples === 0) {
        throw new Error('Cannot divide color range into zero samples.');
      }

      step = 1 / adjustedSamples;

      for (i = 0; i < adjustedSamples; i++) {
        colors.push(colorData.classes(position + (i * step)));
      }

      return colors;
    }

    ChoroplethVisualization.prototype.fillColor = function(colorData, fillClass, feature, highlighted) {

      if (!feature.hasOwnProperty('properties') ||
          !feature.properties.hasOwnProperty(Constants.get('FILTERED_VALUE_PROPERTY_NAME'))) {
        return this.nullColor;
      }

      switch (fillClass) {
        case 'none':
          return 'transparent';
        case 'single':
          return this.defaultSingleColor;
        case 'multi':
          return colorData.scale(Number(feature.properties[Constants.get('FILTERED_VALUE_PROPERTY_NAME')])).hex();
        default:
          throw new Error('Cannot calculate fill color for invalid fill class "' + fillClass + '".');
      }
    };


    ChoroplethVisualization.prototype.strokeColor = function(colorData, fillClass, feature, highlighted) {

      if (!feature.hasOwnProperty('geometry') ||
          !feature.geometry.hasOwnProperty('type')) {
        throw new Error('Cannot calculate stroke color for undefined feature geometry type.');
      }

      if (feature.geometry.type !== 'LineString' &&
          feature.geometry.type !== 'MultiLineString') {
        return (highlighted) ? this.defaultHighlightColor : this.defaultStrokeColor;
      }

      if (!feature.hasOwnProperty('properties') ||
          !feature.properties.hasOwnProperty(Constants.get('FILTERED_VALUE_PROPERTY_NAME'))) {
        return this.nullColor;
      }

      switch (fillClass) {
        case 'none':
          return (highlighted) ? this.defaultHighlightColor : 'black';
        case 'single':
          return (highlighted) ? this.defaultHighlightColor : this.defaultSingleColor;
        case 'multi':
          return (highlighted) ? this.defaultHighlightColor : this.fillColor(colorData, fillClass, feature, false);
        default:
          throw new Error('Cannot calculate stroke color for invalid fill class "' + fillClass + '".');
      }
    };

    ChoroplethVisualization.prototype.strokeWidth = function(fillClass, feature, highlighted) {

      if (!feature.hasOwnProperty('geometry') ||
          !feature.geometry.hasOwnProperty('type')) {
        throw new Error('Cannot calculate stroke width for undefined feature geometry type.');
      }

      switch (feature.geometry.type) {
        case 'LineString':
        case 'MultiLineString':
          return 3;
        default:
          return (highlighted) ? 3 : 1;
      }
    };

    ChoroplethVisualization.prototype.getStyleFn = function(colorData, fillClass, featureIsHighlighted) {
      var visualization = this;
      return function(feature) {
        var highlighted = feature.properties[Constants.get('HIGHLIGHTED_PROPERTY_NAME')];
        return {
          fillColor: visualization.fillColor(colorData, fillClass, feature, highlighted),
          color: visualization.strokeColor(colorData, fillClass, feature, highlighted),
          weight: visualization.strokeWidth(fillClass, feature, highlighted),
          opacity: (fillClass === 'none') ? 1 : 0.8,
          dashArray: 0,
          fillOpacity: (fillClass === 'none') ? 1 : 0.8
        };
      }
    };

    var choroplethVisualization = new ChoroplethVisualization();

    return {
      getChoroplethVisualization: function() {
        return choroplethVisualization;
      }
    };

  }

  angular.
    module('dataCards.services').
      factory('ChoroplethVisualizationService', ['Constants', ChoroplethVisualizationService]);

})();
