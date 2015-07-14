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

    var val = parseFloat(value);
    var absVal = Math.abs(val);

    // TODO: Should this check be reframed in terms of precision and/or maxLength options?
    if (absVal < 9999.5) {
      // This branch handles everything that doesn't use a magnitude suffix.
      // Thousands less than 10K are commaified.
      var parts = absVal.toString().split('.').concat('');
      var precision = Math.min(parts[1].length, options.maxLength - parts[0].length);
      if (_.isNumber(options.precision)) {
        precision = Math.min(precision, options.precision);
      }
      return commaify(val.toFixed(precision), options.groupCharacter, options.decimalCharacter);
    } else if (/e/i.test(val)) {
      // This branch handles huge numbers that switch to exponent notation.
      var exponentParts = val.toString().split(/e\+?/i);
      var symbolIndex = Math.floor(parseFloat(exponentParts[1]) / 3) - 1;

      var newValue = exponentParts[0];
      var shiftAmount = parseFloat(exponentParts[1]) % 3;
      if (shiftAmount > 0) {
        // Adjust from e.g. 1.23e+4 to 12.3K
        newValue = newValue.replace(/^(-?\d+)(\.\d+)?$/, function(match, whole, frac) {
          frac = frac || '.000';
          return '{0}.{1}'.format(whole + frac.slice(1, 1 + shiftAmount), frac.slice(shiftAmount));
        });
      }
      newValue = parseFloat(Math.abs(newValue)).toFixed(options.maxLength - shiftAmount - 1);
      if (newValue === '1000') {
        // The one edge case to handle is when 999.9[KMB...] rounds up, which
        // bumps us into the next magnitude.
        newValue = '1';
        symbolIndex++;
      }

      return '{neg}{value}{sym}'.format({
        neg: val < 0 ? '-' : '',
        value: parseFloat(newValue),
        sym: MAGNITUDE_SYMBOLS[symbolIndex]
      });
    } else {
      // This branch handles values that need a magnitude suffix.
      // We use commaify to determine what magnitude we're operating in.
      var magnitudeGroups = commaify(absVal.toFixed(0)).split(',');
      var symbolIndex = magnitudeGroups.length - 2;

      var newValue = parseFloat(magnitudeGroups[0] + '.' + magnitudeGroups[1]);
      newValue = newValue.toFixed(options.maxLength - magnitudeGroups[0].length - 1);
      if (newValue === '1000') {
        // The one edge case to handle is when 999.9[KMB...] rounds up, which
        // bumps us into the next magnitude.
        newValue = '1';
        symbolIndex++;
      }

      return '{neg}{value}{sym}'.format({
        neg: val < 0 ? '-' : '',
        value: parseFloat(newValue),
        sym: MAGNITUDE_SYMBOLS[symbolIndex]
      });
    }
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
