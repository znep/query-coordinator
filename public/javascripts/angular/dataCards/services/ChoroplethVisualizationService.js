(function() {
  'use strict';

  function ChoroplethVisualizationService(Constants, numberFormatter) {

    function ChoroplethVisualizationUtils() {

      // Default colors.
      this.nullColor = '#ddd';
      this.defaultSingleColor = 'teal';
      this.defaultStrokeColor = 'white';
      this.defaultHighlightColor = '#debb1e';

      // Color classes.
      this.negativeColorRange = ['#c6663d', '#e4eef0'],
      this.positiveColorRange = ['#e4eef0', '#408499'],
      this.divergingColors = ['brown','lightyellow','teal'],
      this.qualitativeColors = ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"];
      this.defaultColorRange = this.positiveColorRange;
    };


    /*******************
    * Data calculation *
    *******************/

    ChoroplethVisualizationUtils.prototype.calculateDataClassBreaks = function(geojsonAggregateData, propertyName) {

      function getGeojsonValues(geojson, attr) {
        var data = [];
        _.each(geojson.features, function(feature){
          if (!feature || !feature.properties) return [];
          var val = feature.properties[attr];
          if (!val) {
            return;
          } else {
            data.push(feature.properties[attr]);
          }
        });
        return data;
      }

      function oddNumbered(num) {
        if (num % 2 == 0) {
          return num - 1;
        } else {
          return num;
        }
      }

      function numberOfClasses(values) {
        // handles numberOfClasses in Jenks (implemented for _.uniq(values).length > 6)
        var numPossibleBreaks = _.uniq(values).length;
        if (numPossibleBreaks <= Constants['MAXIMUM_NUMBER_OF_CLASSES_ALLOWED']) {
          throw new Error("[Choropleth] Why are you calling numberOfClasses when # unique values <= " + Constants['MAXIMUM_NUMBER_OF_CLASSES_ALLOWED'] + "?");
        }

        var evenPossibleBreaks = numPossibleBreaks - (numPossibleBreaks % 2);
        var maxNumClasses = evenPossibleBreaks / 2;
        return _.min([oddNumbered(maxNumClasses), 7]);
      }

      function createClassBreaks(options) {
        var classBreaks;
        switch(options.method || 'jenks') {
          case 'jenks':
            options.methodParam = options.numberOfClasses || 4;
            classBreaks = ss['jenks'](options.data, options.methodParam);
            break;
          case 'quantile':
            options.methodParam = options.p;
            classBreaks = ss['quantile'](options.data, options.methodParam);
            break;
          case 'equalInterval':
            var minVal = _.min(options.data),
                maxVal = _.max(options.data);
            classBreaks = d3.scale.linear().domain([minVal, maxVal]).nice().ticks(_.min([options.numberOfClasses, 4]));
            // include min and max back into d3 scale, if #nice truncates them
            if (_.min(classBreaks) > minVal) classBreaks.unshift(minVal);
            if (_.max(classBreaks) < maxVal) classBreaks.push(maxVal);
            break;
          default:
            throw new Error('Invalid/non-supported class breaks method ' + options.method);
        }
        return _.uniq(classBreaks);
      }

      var values = getGeojsonValues(geojsonAggregateData, propertyName);

      var uniqValues = _.uniq(values);
      var numPossibleBreaks = uniqValues.length - 1;
      var classBreaks;
      if (numPossibleBreaks <= Constants['MAXIMUM_NUMBER_OF_CLASSES_ALLOWED']) {
        // for such small values, jenks does not make sense (produces duplicate values).
        // use equal interval in such cases.
        classBreaks = createClassBreaks({
          method: 'equalInterval',
          data: values,
          numberOfClasses: values.length
        });
      } else {
        classBreaks = createClassBreaks({
          method: 'jenks',
          data: values,
          numberOfClasses: numberOfClasses(values)
        });
      }
      return classBreaks;
    }


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
          throw new Error('Cannot calculate qualitative coloring parameters for more than ' +
                          this.qualitativeColors.length + ' class breaks.');
        }
        colorRange = this.qualitativeColors.slice(0, classBreaks.length);
      }
      if (2 === colorRange.length) {
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

    ChoroplethVisualizationUtils.prototype.fillColor = function(colorScale, feature, highlighted) {

      if (!feature.hasOwnProperty('properties') ||
          !feature.properties.hasOwnProperty(Constants['FILTERED_VALUE_PROPERTY_NAME']) ||
          feature.properties[Constants['FILTERED_VALUE_PROPERTY_NAME']] === null ||
          !_.isDefined(feature.properties[Constants['FILTERED_VALUE_PROPERTY_NAME']])) {
        return this.nullColor;
      }

      if (colorScale) {
        return String(
          colorScale(Number(feature.properties[Constants['FILTERED_VALUE_PROPERTY_NAME']]))
        );
      } else {
        return 'transparent';
      }
    };


    ChoroplethVisualizationUtils.prototype.strokeColor = function(colorScale, feature, highlighted) {

      if (!feature.hasOwnProperty('geometry') ||
          !feature.geometry.hasOwnProperty('type')) {
        throw new Error('Cannot calculate stroke color for undefined feature geometry type.');
      }

      if (feature.geometry.type !== 'LineString' &&
          feature.geometry.type !== 'MultiLineString') {
        return (highlighted) ? this.defaultHighlightColor : this.defaultStrokeColor;
      }

      if (!feature.hasOwnProperty('properties') ||
          !feature.properties.hasOwnProperty(Constants['FILTERED_VALUE_PROPERTY_NAME']) ||
          feature.properties[Constants['FILTERED_VALUE_PROPERTY_NAME']] === null ||
          !_.isDefined(feature.properties[Constants['FILTERED_VALUE_PROPERTY_NAME']])) {
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

    ChoroplethVisualizationUtils.prototype.getStyleFn = function(colorScale) {
      var visualization = this;
      var selectedPropertyName = Constants['SELECTED_PROPERTY_NAME'];
      return function(feature) {
        var highlighted = false;
        if (feature.hasOwnProperty('properties') &&
            feature.properties.hasOwnProperty(selectedPropertyName) &&
            feature.properties[selectedPropertyName]) {
          highlighted = feature.properties[selectedPropertyName];
        }
        var opacity = colorScale ? 0.8 : 1;
        return {
          fillColor: visualization.fillColor(colorScale, feature, highlighted),
          color: visualization.strokeColor(colorScale, feature, highlighted),
          weight: visualization.strokeWidth(feature, highlighted),
          opacity: opacity,
          dashArray: 0,
          fillOpacity: opacity
        };
      }
    };

    ChoroplethVisualizationUtils.prototype.bigNumTickFormatter = function(val) {
      // used if ss.standard_deviation(classBreaks) > 10
      // val = a x 10^b (a: coefficient, b: exponent);
      if (val === 0) {
        return 0;
      }
      var exponent = Math.floor(Math.log(Math.abs(val)) / Math.LN10);
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
    };

    /**
     * If the values straddle 0, we want to add a break at 0
     *
     * @return {Number} the index at which we added 0, or -1 if we didn't.
     * @protected
     */
    ChoroplethVisualizationUtils.prototype.addZeroIfNecessary = function(classBreaks) {
      var indexOf0 = _.sortedIndex(classBreaks, 0);
      if (
        (indexOf0 > 0 && indexOf0 < classBreaks.length) &&
        // Don't add it if it's already there
        (classBreaks[indexOf0] !== 0 && classBreaks[indexOf0 - 1] !== 0)
      ) {
        classBreaks.splice(indexOf0, 0, 0);
        return indexOf0;
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
