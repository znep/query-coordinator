(function() {
  'use strict';

  function ChoroplethVisualizationService(Constants, FormatService) {

    function ChoroplethVisualizationUtils() {

      // Default colors.
      this.nullColor = '#ddd';
      this.defaultSingleColor = 'teal';
      this.defaultStrokeColor = 'white';
      this.defaultHighlightColor = '#debb1e';

      // Color classes.
      this.negativeColorRange = ['#c6663d', '#e4eef0'];
      this.positiveColorRange = ['#e4eef0', '#408499'];
      this.divergingColors = ['brown', 'lightyellow', 'teal'];
      this.qualitativeColors = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];
      this.defaultColorRange = this.positiveColorRange;
    }

    // Data calculation

    ChoroplethVisualizationUtils.prototype.calculateDataClassBreaks = function(geojsonAggregateData, propertyName) {

      function getGeojsonValues(geojson, attr) {
        var data = [];

        _.each(geojson.features, function(feature) {
          if (!_.get(feature, 'properties', false)) {
            return [];
          }

          var val = feature.properties[attr];

          if (_.hasValue(val)) {
            data.push(feature.properties[attr]);
          }
        });

        return data;
      }

      function oddNumbered(num) {
        if (num % 2 === 0) {
          return num - 1;
        } else {
          return num;
        }
      }

      function numberOfClasses(values) {

        // Handles numberOfClasses in Jenks (implemented for _.uniq(values).length > 6)
        var possibleBreaks = _.uniq(values).length;

        if (possibleBreaks <= Constants.MAXIMUM_NUMBER_OF_CLASSES_ALLOWED) {
          throw new Error('[Choropleth] Why are you calling numberOfClasses when # unique values <= {0}?'.format(Constants.MAXIMUM_NUMBER_OF_CLASSES_ALLOWED));
        }

        var evenPossibleBreaks = possibleBreaks - (possibleBreaks % 2);
        var maxNumClasses = evenPossibleBreaks / 2;
        return _.min([oddNumbered(maxNumClasses), 7]);
      }

      function createClassBreaks(options) {
        var classBreaks;

        switch (options.method || 'jenks') {
          case 'jenks':
            options.methodParam = options.numberOfClasses || 4;
            classBreaks = ss.jenks(options.data, options.methodParam);
            break;
          case 'quantile':
            options.methodParam = options.p;
            classBreaks = ss.quantile(options.data, options.methodParam);
            break;
          case 'equalInterval':
            var minVal = _.min(options.data);
            var maxVal = _.max(options.data);

            if (minVal === maxVal) {
              classBreaks = [minVal];
            } else {
              var scale = d3.scale.linear().domain([minVal, maxVal]);
              classBreaks = scale.nice().ticks(_.min([options.numberOfClasses, 4]));

              // Make sure min and max are in the classBreak ticks that d3 gives us.
              if (classBreaks[0] > minVal) {
                classBreaks.unshift(minVal);
              }

              if (_.last(classBreaks) < maxVal) {
                classBreaks.push(maxVal);
              }
            }
            break;
          default:
            throw new Error('Invalid/non-supported class breaks method {0}'.format(options.method));
        }
        return _.uniq(classBreaks);
      }

      var geojsonValues = getGeojsonValues(geojsonAggregateData, propertyName);
      var uniqueGeojsonValues = _.uniq(geojsonValues);
      var numberOfPossibleBreaks = uniqueGeojsonValues.length - 1;
      var classBreaksArgs = {};

      // For very small values, 'jenks' does not make sense (produces
      // duplicate values).  Thus, use 'equalInterval' in this cases.
      if (numberOfPossibleBreaks <= Constants.MAXIMUM_NUMBER_OF_CLASSES_ALLOWED) {
        classBreaksArgs.method = 'equalInterval';
        classBreaksArgs.numberOfClasses = uniqueGeojsonValues.length;
      } else {
        classBreaksArgs.method = 'jenks';
        classBreaksArgs.numberOfClasses = numberOfClasses(geojsonValues);
      }

      return createClassBreaks({
        method: classBreaksArgs.method,
        data: geojsonValues,
        numberOfClasses: classBreaksArgs.numberOfClasses
      });
    };


    // Style calculation

    /**
     * @param {String[]|String} colorRange A string, or an array of color strings defining the range
     * of colors the scale should span. There are several predefined values you can use:
     * this.divergingColors, this.qualitativeColors, this.positiveColorRange.
     */
    ChoroplethVisualizationUtils.prototype.calculateColoringScale = function(colorRange, classBreaks) {
      if (!_.isArray(classBreaks)) {
        throw new Error('Cannot calculate coloring parameters with nvalid class breaks.');
      }

      if (this.qualitativeColors === colorRange) {
        if (classBreaks.length > colorRange.length) {
          throw new Error('Cannot calculate qualitative coloring parameters for more than {0} class breaks.'.format(this.qualitativeColors.length));
        }
        colorRange = this.qualitativeColors.slice(0, classBreaks.length);
      }

      if (colorRange.length === 2) {
        colorRange = chroma.interpolate.bezier(colorRange);
      }

      return chroma.
        scale(colorRange).
        domain(classBreaks).

        // For linear color ranges, make sure the lightness varies linearly
        correctLightness(colorRange.length === 2).

        // use LAB color space to approximate perceptual brightness
        // See more: https://vis4.net/blog/posts/mastering-multi-hued-color-scales/
        mode('lab');
    };

    ChoroplethVisualizationUtils.prototype.fillColor = function(colorScale, feature) {

      var unfilteredValue = _.get(feature, 'properties.{0}'.format(Constants.UNFILTERED_VALUE_PROPERTY_NAME));
      var filteredValue = _.get(feature, 'properties.{0}'.format(Constants.FILTERED_VALUE_PROPERTY_NAME));

      if (_.isFinite(filteredValue) && _.isFinite(unfilteredValue)) {
        if (colorScale) {
          return String(colorScale(filteredValue));
        } else {
          return 'transparent';
        }
      } else {
        return this.nullColor;
      }
    };


    ChoroplethVisualizationUtils.prototype.strokeColor = function(colorScale, feature, highlighted) {
      if (!_.has(feature, 'geometry.type')) {
        throw new Error('Cannot calculate stroke color for undefined feature geometry type.');
      }

      if (!_.contains(['LineString', 'MultiLineString'], feature.geometry.type)) {
        return highlighted ? this.defaultHighlightColor : this.defaultStrokeColor;
      }

      if (!_.hasValue(_.get(feature, 'properties.{0}'.format(Constants.FILTERED_VALUE_PROPERTY_NAME), undefined)) ||
          !_.isFinite(feature.properties[Constants.UNFILTERED_VALUE_PROPERTY_NAME])) {
        return this.nullColor;
      }

      if (highlighted) {
        return this.defaultHighlightColor;
      } else if (colorScale) {
        return this.fillColor(colorScale, feature, false);
      } else {
        return this.defaultStrokeColor;
      }
    };

    ChoroplethVisualizationUtils.prototype.strokeWidth = function(feature, highlighted) {

      if (!_.has(feature, 'geometry.type')) {
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

    ChoroplethVisualizationUtils.prototype.getStyleFn = function(colorScale) {
      var visualization = this;
      var selectedPropertyName = Constants.SELECTED_PROPERTY_NAME;

      return function(feature) {
        var highlighted = false;
        var opacity = colorScale ? 0.8 : 1;

        if (_.hasValue(_.get(feature, 'properties.{0}'.format(selectedPropertyName), undefined))) {
          highlighted = feature.properties[selectedPropertyName];
        }

        return {
          fillColor: visualization.fillColor(colorScale, feature, highlighted),
          color: visualization.strokeColor(colorScale, feature, highlighted),
          weight: visualization.strokeWidth(feature, highlighted),
          opacity: opacity,
          dashArray: 0,
          fillOpacity: opacity
        };
      };
    };

    ChoroplethVisualizationUtils.prototype.bigNumTickFormatter = function(val) {

      // Used if ss.standard_deviation(classBreaks) > 10
      // val = a * 10^b (a: coefficient, b: exponent);
      if (val === 0) {
        return 0;
      }

      var exponent = Math.floor(Math.log(Math.abs(val)) / Math.LN10);
      var coefficient = val / Math.pow(10, exponent);
      var isMultipleOf10 = coefficient % 10 === 0;
      var numNonzeroDigits;
      var formattedNum;

      if (isMultipleOf10) {
        numNonzeroDigits = coefficient.toString().length;
        formattedNum = FormatService.formatNumber(val, {
          precision: 0,
          maxLength: _.min([numNonzeroDigits, 3])
        });
      } else {
        numNonzeroDigits = coefficient.toString().length - 1;
        formattedNum = FormatService.formatNumber(val, {
          maxLength: _.min([numNonzeroDigits, 3])
        });
      }

      return formattedNum;
    };

    /**
     * If the values straddle 0, we want to add a break at 0
     *
     * @return {Number} the index at which we added 0, or -1 if we didn't.
     * @protected
     */
    ChoroplethVisualizationUtils.prototype.addZeroIfNecessary = function(classBreaks) {
      var indexOfZero = _.sortedIndex(classBreaks, 0);

      // Do not need to add break if it already exists.
      if (_.inRange(indexOfZero, 1, classBreaks.length) &&
        (classBreaks[indexOfZero] !== 0) &&
        (classBreaks[indexOfZero - 1] !== 0)) {
        classBreaks.splice(indexOfZero, 0, 0);
        return indexOfZero;
      }

      return -1;
    };

    var utils = new ChoroplethVisualizationUtils();

    return {
      utils: utils
    };

  }

  angular.
    module('dataCards.services').
      factory('ChoroplethVisualizationService', ChoroplethVisualizationService);

})();
