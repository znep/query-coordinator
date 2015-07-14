angular.module('dataCards.services').factory('FormatService', function() {
  'use strict';

  var MAGNITUDE_SYMBOLS = ['K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y'];

  var formatNumber = function(value, options) {
    if (!_.isNumber(value)) {
      throw new Error('formatNumber requires numeric input');
    }

    var defaultOptions = {
      groupCharacter: ',',
      decimalCharacter: '.'
    };

    options = _.assign({}, defaultOptions, options);

    var val = parseFloat(value);
    var absVal = Math.abs(val);
    var maxLength = 4;
    var newValue;
    var symbolIndex;

    if (absVal < 9999.5) {

      // This branch handles everything that doesn't use a magnitude suffix.
      // Thousands less than 10K are commaified.
      var parts = absVal.toString().split('.').concat('');
      var precision = Math.min(parts[1].length, maxLength - parts[0].length);
      var newValue = val.toFixed(precision).replace('.', options.decimalCharacter);
      return commaify(newValue, options.groupCharacter, options.decimalCharacter);
    } else if (/e/i.test(val)) {

      // This branch handles huge numbers that switch to exponent notation.
      var exponentParts = val.toString().split(/e\+?/i);
      symbolIndex = Math.floor(parseFloat(exponentParts[1]) / 3) - 1;
      newValue = exponentParts[0];

      var shiftAmount = parseFloat(exponentParts[1]) % 3;
      if (shiftAmount > 0) {

        // Adjust from e.g. 1.23e+4 to 12.3K
        newValue = newValue.replace(/^(-?\d+)(\.\d+)?$/, function(match, whole, frac) {
          frac = frac || '.000';
          return '{0}.{1}'.format(whole + frac.slice(1, 1 + shiftAmount), frac.slice(shiftAmount));
        });
      }

      newValue = parseFloat(Math.abs(newValue)).toFixed(maxLength - shiftAmount - 1);
    } else {

      // This branch handles values that need a magnitude suffix.
      // We use commaify to determine what magnitude we're operating in.
      var magnitudeGroups = commaify(absVal.toFixed(0)).split(',');
      symbolIndex = magnitudeGroups.length - 2;
      newValue = parseFloat(magnitudeGroups[0] + '.' + magnitudeGroups[1]);
      newValue = newValue.toFixed(maxLength - magnitudeGroups[0].length - 1);
    }

    // The one edge case to handle is when 999.9[KMB...] rounds up, which
    // bumps us into the next magnitude.
    if (newValue === '1000') {
      newValue = '1';
      symbolIndex++;
    }

    if (_.isDefined(MAGNITUDE_SYMBOLS[symbolIndex])) {
      return '{neg}{value}{sym}'.format({
        neg: val < 0 ? '-' : '',
        value: parseFloat(newValue).toString().replace('.', options.decimalCharacter),
        sym: MAGNITUDE_SYMBOLS[symbolIndex]
      });
    } else {
      return val.toString();
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
