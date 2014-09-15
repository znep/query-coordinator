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
        } else {
          var evenPossibleBreaks = numPossibleBreaks - (numPossibleBreaks % 2);
          var maxNumClasses = evenPossibleBreaks / 2;
        }
        return _.min([oddNumbered(maxNumClasses), 7]);
      }

      function createClassBreaks(options) {
        var classBreaks;
        options.method = options.method || 'jenks';
        switch(options.method) {
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


    /********************
    * Style calculation *
    ********************/

    ChoroplethVisualization.prototype.calculateColoringParameters = function(colorClass, classBreaks) {
      var colorRange;
      var lightnessCorrection;
      var bezierColorInterpolation;
      var colorClasses;
      var scale;

      if (!_.isArray(classBreaks)) {
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

      scale = new chroma.
        scale(colorClasses).
        domain(classBreaks).
        correctLightness(lightnessCorrection).
        // use LAB color space to approximate perceptual brightness,
        // bezier interpolation, and auto-correct for color brightness.
        // See more: https://vis4.net/blog/posts/mastering-multi-hued-color-scales/
        mode('lab');

      return { scale: scale, classes: colorClasses };
    };

    ChoroplethVisualization.prototype.fillColor = function(colorData, fillClass, feature, highlighted) {

      if (!feature.hasOwnProperty('properties') ||
          !feature.properties.hasOwnProperty(Constants['FILTERED_VALUE_PROPERTY_NAME']) ||
          feature.properties[Constants['FILTERED_VALUE_PROPERTY_NAME']] === null ||
          !_.isDefined(feature.properties[Constants['FILTERED_VALUE_PROPERTY_NAME']])) {
        return this.nullColor;
      }

      switch (fillClass) {
        case 'none':
          return 'transparent';
        case 'single':
        case 'multi':
          return colorData.scale(Number(feature.properties[Constants['FILTERED_VALUE_PROPERTY_NAME']])).hex();
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
          !feature.properties.hasOwnProperty(Constants['FILTERED_VALUE_PROPERTY_NAME']) ||
          feature.properties[Constants['FILTERED_VALUE_PROPERTY_NAME']] === null ||
          !_.isDefined(feature.properties[Constants['FILTERED_VALUE_PROPERTY_NAME']])) {
        return this.nullColor;
      }

      switch (fillClass) {
        case 'none':
          return (highlighted) ? this.defaultHighlightColor : 'black';
        case 'single':
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

    ChoroplethVisualization.prototype.getStyleFn = function(colorData, fillClass) {
      var visualization = this;
      var selectedPropertyName = Constants['SELECTED_PROPERTY_NAME'];
      return function(feature) {
        var highlighted = false;
        if (feature.hasOwnProperty('properties') &&
            feature.properties.hasOwnProperty(selectedPropertyName) &&
            feature.properties[selectedPropertyName]) {
          highlighted = feature.properties[selectedPropertyName];
        }
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
      factory('ChoroplethVisualizationService', ChoroplethVisualizationService);

})();
