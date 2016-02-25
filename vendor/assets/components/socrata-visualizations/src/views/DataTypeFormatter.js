'use strict';
var utils = require('socrata-utils');
var moment = require('moment');

module.exports = {
  renderCell: renderCell,
  renderBooleanCell: renderBooleanCell,
  renderNumberCell: renderNumberCell,
  renderGeoCell: renderGeoCell,
  renderGeoCellHTML: renderGeoCellHTML,
  renderMoneyCell: renderMoneyCell,
  renderTimestampCell: renderTimestampCell
};

function renderCell(cellContent, column, i18n) {
  var cellText;

  utils.assertIsOneOfTypes(column, 'object');
  utils.assertHasProperty(column, 'renderTypeName');

  if (_.isUndefined(cellContent)) {
    return '';
  }

  switch (column.renderTypeName) {
    case 'checkbox':
      cellText = _.escape(renderBooleanCell(cellContent, column));
      break;
    case 'number':
      cellText = _.escape(renderNumberCell(cellContent, column));
      break;

    // Avoid escaping because cell content is HTML.
    case 'geo_entity':
    case 'point':
      cellText = renderGeoCellHTML(cellContent, column, i18n);
      break;
    case 'calendar_date':
      cellText = _.escape(renderTimestampCell(cellContent, column));
      break;
    case 'money':
      cellText = _.escape(renderMoneyCell(cellContent, column));
      break;
    default:
      cellText = _.escape(cellContent);
      break;
  }
  return cellText;
}



/**
* Renders a boolean value in checkbox format
*/
function renderBooleanCell(cellContent) {
  return _.isBoolean(cellContent) && cellContent ? '✓' : '';
}

/**
* Render a number based on column specified formatting.
* This has lots of possible options, so we delegate to helpers.
*/
function renderNumberCell(input, column) {
  if (_.isNull(input) || _.isUndefined(input) || input.toString().length === 0) {
    return '';
  }

  var amount = parseFloat(input);

  var format = _.extend({
    precisionStyle: 'standard',
    precision: undefined,
    noCommas: false,
    currency: '$',
    decimalSeparator: '.',
    groupSeparator: ',',
    mask: null
  }, column.format || {});

  format.commaifyOptions = {
    decimalCharacter: format.decimalSeparator,
    groupCharacter: format.groupSeparator
  };

  if (column.dataTypeName === 'percent') {
    return _renderPercentageNumber(amount, format);
  } else if (format.mask) {
    return _renderMaskedNumber(amount, format);
  } else {
    switch (format.precisionStyle) {
      case 'percentage':
        return _renderPercentageNumber(amount, format);
      case 'scientific':
        return _renderScientificNumber(amount, format);
      case 'currency':
        return _renderCurrencyNumber(amount, format);
      case 'financial':
        return _renderFinancialNumber(amount, format);
      case 'standard':
      default:
        return _renderStandardNumber(amount, format);
    }
  }
}

/**
* Renders a Point in plain text as a lat/lng pair.
*/
function renderGeoCell(cellContent) {
  var latitudeIndex = 1;
  var longitudeIndex = 0;
  var coordinates = _cellCoordinates(cellContent);
  if (coordinates) {
    return '({latitude}°, {longitude}°)'.format({
      latitude: coordinates[latitudeIndex],
      longitude: coordinates[longitudeIndex]
    });
  } else {
    return '';
  }
}

/**
* Renders a Point wrapped in an HTML span element
*
* Parameters:
* - cellContent: data for the cell (from soda fountain).
* - i18n: Object containing localized strings for latitude and longitude. Example:
*   {
*     latitude: 'Latitude',
*     longitude: 'Longitude'
*   }
*/
function renderGeoCellHTML(cellContent, columnMetadata, i18n) {
  var latitudeIndex = 1;
  var longitudeIndex = 0;
  var coordinates = _cellCoordinates(cellContent);

  utils.assertHasProperties(i18n, 'latitude', 'longitude');
  if (coordinates) {
    var template = '<span title="{0}">{1}°</span>';
    var latitude = template.format(i18n.latitude, coordinates[latitudeIndex]);
    var longitude = template.format(i18n.longitude, coordinates[longitudeIndex]);
    return '({latitude}, {longitude})'.format({
      latitude: latitude,
      longitude: longitude
    });
  } else {
    return '';
  }
}

/**
* Render a numeric value as currency
*/
function renderMoneyCell(cellContent, column) {
  var format = _.extend({
    currency: '$',
    decimalSeparator: '.',
    groupSeparator: ',',
    humane: false,
    precision: 2
  }, column.format || {});
  var amount = parseFloat(cellContent);

  if (_.isFinite(amount)) {
    if (format.humane) {
      // We can't use formatNumber here because this use case is
      // slightly different — we want to enforce a certain precision,
      // whereas the normal humane numbers want to use the fewest
      // digits possible at all times.
      // The handling on thousands-scale numbers is also different,
      // because humane currency will always be expressed with the K
      // scale suffix, whereas our normal humane numbers allow four-
      // digit thousands output.
      var absVal = Math.abs(amount);
      if (absVal < 1000) {
        cellContent = absVal.toFixed(format.precision).
          replace('.', format.decimalSeparator);
      } else {
        // At this point, we know that we're going to use a suffix for
        // scale, so we lean on commaify to split up the scale groups.
        // The number of groups can be used to select the correct
        // scale suffix, and we can do precision-related formatting
        // by taking the first two scale groups and treating them
        // as a float.
        // For instance, "12,345,678" will become an array of three
        // substrings, and the first two will combine into "12.345"
        // so that our toFixed call can work its magic.
        var scaleGroupedVal = utils.commaify(Math.floor(absVal)).split(',');
        var symbols = ['K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y'];
        var symbolIndex = scaleGroupedVal.length - 2;

        var value = parseFloat(scaleGroupedVal[0] + '.' + scaleGroupedVal[1]);
        value = value.toFixed(format.precision);
        if (parseFloat(value) === 1000) {
          // The only edge case is when rounding takes us into the
          // next scale group: 999,999 should be 1M not 1000K.
          value = '1';
          if (format.precision > 0) {
            value += '.' + _.repeat('0', format.precision);
          }
          symbolIndex++;
        }

        cellContent = value.replace('.', format.decimalSeparator) + symbols[symbolIndex];
      }
    } else {
      // Normal formatting without abbreviation.
      var commaifyOptions = {
        groupCharacter: format.groupSeparator,
        decimalCharacter: format.decimalSeparator
      };

      cellContent = utils.commaify(
        Math.abs(amount).toFixed(format.precision),
        commaifyOptions
      );
    }
    cellContent = '{sign}{currency}{cellContent}'.format({
      sign: amount < 0 ? '-' : '',
      currency: format.currency,
      cellContent: cellContent
    });
  }
  return cellContent;
}

/**
* Render a date or timestamp following column formatting, otherwise following defaults.
*/
function renderTimestampCell(cellContent, column) {
  if (!_.isEmpty(cellContent)) {
    var time = moment(new Date(cellContent));
    if (time.isValid()) {
      if (column.format && column.format.formatString) {
        // Option A: format using user-specified format string
        return time.format(column.format.formatString);
      } else if (time.hour() + time.minute() + time.second() + time.millisecond() === 0) {
        // Option B: infer date-only string format
        return time.format('YYYY MMM DD');
      } else {
        // Option C: use date-with-time format
        return time.format('YYYY MMM DD hh:mm:ss A');
      }
    }
  }
  return '';
}

/**
 * hoisted helper methods below
 * (must belong to this scope in order to access $window)
 */

function _renderCurrencyNumber(amount, format) {
  var isNegative = amount < 0;

  var value = Math.abs(amount);
  if (format.precision >= 0) {
    value = value.toFixed(format.precision);
  }

  value = utils.commaify(value, format.commaifyOptions);
  if (format.noCommas) {
    value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
  }

  return '{sign}{currency}{value}'.format({
    sign: isNegative ? '-' : '',
    currency: format.currency,
    value: value
  });
}

function _renderFinancialNumber(amount, format) {
  var isNegative = amount < 0;

  var value = Math.abs(amount);
  if (format.precision >= 0) {
    value = value.toFixed(format.precision);
  }

  value = utils.commaify(value, format.commaifyOptions);
  if (format.noCommas) {
    value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
  }

  if (isNegative) {
    return '({0})'.format(value);
  } else {
    return String(value);
  }
}

function _renderScientificNumber(amount, format) {
  var value =  amount.toExponential(format.precision);

  // no groups, so we can skip groupSeparator and commaify and noCommas
  return value.replace('.', format.decimalSeparator);
}

function _renderPercentageNumber(amount, format) {
  var value = amount;
  if (format.precision >= 0) {
    value = value.toFixed(format.precision);
  }

  value = utils.commaify(value, format.commaifyOptions);
  if (format.noCommas) {
    value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
  }

  return value + '%';
}

function _renderStandardNumber(amount, format) {
  var value = amount;
  if (format.precision >= 0) {
    value = value.toFixed(format.precision);
  }

  if (/^-?\d{4}$/.test(value)) {
    return value;
  }

  value = utils.commaify(value, format.commaifyOptions);
  // Force commaify off for four-digit numbers (workaround for year columns)
  if (format.noCommas) {
    value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
  }

  return value;
}

// NOTE: In the dataset view, a mask can lead to some really strange output.
// We're going to start with a simple approach and refine as we go on.
function _renderMaskedNumber(amount, format) {
  var maskChar = '#';
  var amountChars = String(amount).split('');
  var output = format.mask.slice(0, amountChars.length);

  while (output.indexOf(maskChar) > -1) {
    output = output.replace(maskChar, amountChars.shift());
  }
  output += amountChars.join('');

  return output;
}

function _cellCoordinates(cellContent) {
  var coordinates = _.get(cellContent, 'value.coordinates', cellContent.coordinates);
  return _.isArray(coordinates) ? coordinates : null;
}

