angular.module('dataCards.services').factory('FormatService', function() {
  'use strict';

  var MAGNITUDE_SYMBOLS = ['K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y'];

  var formatNumber = function(value, options) {
    if (!_.isNumber(value)) {
      throw new Error('formatNumber requires numeric input');
    }

    var defaultOptions = {
      groupCharacter: ',',
      decimalCharacter: '.',
      maxLength: 4,
      precision: null
    };

    options = _.assign({}, defaultOptions, options);

    if (options.precision < 0) {
      throw new Error('Negative precision "{0}" passed to formatNumber.'.format(options.precision));
    }

    if (options.maxLength < 0) {
      throw new Error('Negative maxLength "{0}" passed to formatNumber.'.format(options.maxLength));
    }

    var step = 1000;
    var divider = Math.pow(step, MAGNITUDE_SYMBOLS.length);
    var val = parseFloat(value);
    var absVal = Math.abs(val);
    var parts = absVal.toString().split(options.decimalCharacter);

    if (absVal < 1000 || parts[0].length <= options.maxLength) {
      var precision = Math.max(options.maxLength - parts[0].length, 0);
      if (_.isNumber(options.precision)) {
        precision = Math.min(precision, options.precision);
      }

      return commaify(parseFloat(val.toFixed(precision)), options.groupCharacter, options.decimalCharacter);
    }

    for (var i = MAGNITUDE_SYMBOLS.length - 1; i >= 0; i--) {
      if (absVal >= divider) {
        var count = (absVal / divider).toFixed(0).length;

        var precision = Math.max(options.maxLength - count - 1, 0);
        if (_.isNumber(options.precision)) {
          precision = Math.min(precision, options.precision);
        }

        var result = (absVal / divider).toFixed(precision);

        if (val < 0) {
          result = -result;
        }

        result = parseFloat(result);

        if (isFinite(result)) {
          return commaify(result, options.groupCharacter, options.decimalCharacter) + MAGNITUDE_SYMBOLS[i];
        } else {
          return result.toString();
        }
      }
      divider = divider / step;
    }

    return val.toString();
  };

  var commaify = function(value, groupCharacter, decimalCharacter) {
    value = value + '';
    groupCharacter = groupCharacter || ',';
    decimalCharacter = decimalCharacter || '.';

    var pos = value.indexOf(decimalCharacter);

    if (pos === -1) {
      pos = value.length;
    }

    pos -= 3;

    while (pos > 0 && value.charAt(pos - 1) >= '0' && value.charAt(pos - 1) <= '9') {
      value = value.substring(0, pos) + groupCharacter + value.substring(pos);
      pos -= 3;
    }

    return value;
  };

  return {
    formatNumber: formatNumber,
    commaify: commaify
  };
});
