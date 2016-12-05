'use strict';
const $ = require('jquery');
const _ = require('lodash');
const utils = require('socrata-utils');
const moment = require('moment');
// Converts GeoJSON formats to text
const wkt = require('wellknown');
const I18n = require('../I18n');

const CURRENCY_SYMBOLS = {
  'AFN': '؋',
  'ALL': 'Lek',
  'ANG': 'ƒ',
  'ARS': '$',
  'AUD': '$',
  'AWG': 'ƒ',
  'AZN': 'ман',
  'BAM': 'KM',
  'BBD': '$',
  'BGN': 'лв',
  'BMD': '$',
  'BND': '$',
  'BOB': '$b',
  'BRL': 'R$',
  'BSD': '$',
  'BWP': 'P',
  'BYR': 'p.',
  'BZD': 'BZ$',
  'CAD': '$',
  'CHF': 'CHF',
  'CLP': '$',
  'CNY': '¥',
  'COP': '$',
  'CRC': '₡',
  'CUP': '₱',
  'CZK': 'Kč',
  'DKK': 'kr',
  'DOP': 'RD$',
  'EEK': 'kr',
  'EGP': '£',
  'EUR': '€',
  'FJD': '$',
  'FKP': '£',
  'GBP': '£',
  'GGP': '£',
  'GHC': '¢',
  'GIP': '£',
  'GTQ': 'Q',
  'GYD': '$',
  'HKD': '$',
  'HNL': 'L',
  'HRK': 'kn',
  'HUF': 'Ft',
  'INR': 'Rp',
  'ILS': '₪',
  'IMP': '£',
  'IRR': '﷼',
  'ISK': 'kr',
  'JEP': '£',
  'JMD': 'J$',
  'JPY': '¥',
  'KES': 'KSh',
  'KGS': 'лв',
  'KHR': '៛',
  'KPW': '₩',
  'KRW': '₩',
  'KYD': '$',
  'KZT': 'лв',
  'LAK': '₭',
  'LBP': '£',
  'LKR': '₨',
  'LRD': '$',
  'LTL': 'Lt',
  'LVL': 'Ls',
  'MKD': 'ден',
  'MNT': '₮',
  'MUR': '₨',
  'MXN': '$',
  'MYR': 'RM',
  'MZN': 'MT',
  'NAD': '$',
  'NGN': '₦',
  'NIO': 'C$',
  'NOK': 'kr',
  'NPR': '₨',
  'NZD': '$',
  'OMR': '﷼',
  'PAB': 'B/.',
  'PEN': 'S/.',
  'PHP': 'Php',
  'PKR': '₨',
  'PLN': 'zł',
  'PYG': 'Gs',
  'QAR': '﷼',
  'RON': 'lei',
  'RSD': 'Дин.',
  'RUB': 'руб',
  'SAR': '﷼',
  'SBD': '$',
  'SCR': '₨',
  'SEK': 'kr',
  'SGD': '$',
  'SHP': '£',
  'SOS': 'S',
  'SRD': '$',
  'SVC': '$',
  'SYP': '£',
  'THB': '฿',
  'TRL': '₤',
  'TRY': 'TL',
  'TTD': 'TT$',
  'TVD': '$',
  'TWD': 'NT$',
  'UAH': '₴',
  'USD': '$',
  'UYU': '$U',
  'UZS': 'лв',
  'VEF': 'Bs',
  'VND': '₫',
  'XCD': '$',
  'YER': '﷼',
  'ZAR': 'R',
  'ZWD': 'Z$'
};

module.exports = {
  renderCell: renderCell,
  renderBooleanCell: renderBooleanCell,
  renderNumberCell: renderNumberCell,
  renderGeoCell: renderGeoCell,
  renderGeoCellHTML: renderGeoCellHTML,
  renderMoneyCell: renderMoneyCell,
  renderUrlCellHTML: renderUrlCellHTML,
  renderEmailCellHTML: renderEmailCellHTML,
  renderPhoneCellHTML: renderPhoneCellHTML,
  renderPhotoCellHTML: renderPhotoCellHTML,
  renderDocumentCellHTML: renderDocumentCellHTML,
  renderMultipleChoiceCell: renderMultipleChoiceCell,
  renderTimestampCell: renderTimestampCell
};

function renderCell(cellContent, column, domain, datasetUid) {
  let cellText;

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
      cellText = renderGeoCellHTML(cellContent);
      break;
    case 'point':
    case 'line':
    case 'polygon':
    case 'multipoint':
    case 'multiline':
    case 'multipolygon':
      cellText = renderWKTCell(cellContent);
      break;
    case 'calendar_date':
      cellText = _.escape(renderTimestampCell(cellContent, column));
      break;

    // OBE types that are deprecated on new datasets, but are supported on migrated datasets:
    case 'email':
      cellText = renderEmailCellHTML(cellContent);
      break;
    case 'money':
      cellText = _.escape(renderMoneyCell(cellContent, column));
      break;
    // OBE location columns are actually objects with latitude and longitude
    // keys, so we need to handle them as a special case.
    case 'location':
      cellText = _.escape(renderObeLocation(cellContent));
      break;
    // EN-3548 - Note that only OBE datasets can have a column renderTypeName
    // of 'percent'. Corresponding NBE datasets will have a column
    // renderTypeName of 'number'. In order to keep that sort of logic somewhat
    // contained, inside of the implementation of `renderNumberCell()` we do a
    // few tests to figure out if we should be formatting the resulting value
    // as a percentage.
    case 'percent':
      cellText = _.escape(renderNumberCell(cellContent, column));
      break;
    case 'phone':
      cellText = renderPhoneCellHTML(cellContent);
      break;
    case 'url':
      cellText = renderUrlCellHTML(cellContent);
      break;

    // TODO: Remove these types once we no longer support OBE datasets
    // OBE types that are deprecated post-NBE migration:
    case 'date':
      cellText = _.escape(renderTimestampCell(cellContent, column));
      break;
    case 'document':
      cellText = renderDocumentCellHTML(cellContent, domain, datasetUid);
      break;
    case 'drop_down_list':
      cellText = _.escape(renderMultipleChoiceCell(cellContent, column));
      break;
    case 'html': // Formatted Text
      cellText = $(cellContent).text();
      break;
    case 'photo':
      cellText = renderPhotoCellHTML(cellContent, domain, datasetUid);
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
  const amount = parseFloat(input);
  const format = _.extend({
    precisionStyle: 'standard',
    precision: undefined,
    noCommas: false,
    currency: I18n.translate('visualizations.common.currency_symbol'),
    decimalSeparator: I18n.translate('visualizations.common.decimal_separator'),
    groupSeparator: I18n.translate('visualizations.common.group_separator'),
    mask: null
  }, column.format || {});

  if (_.isNull(input) || _.isUndefined(input) || input.toString().length === 0) {
    return '';
  }

  format.commaifyOptions = {
    decimalCharacter: format.decimalSeparator,
    groupCharacter: format.groupSeparator
  };

  // EN-3548 - OBE percent columns have a renderTypeName of 'percent'; the
  // corresponding NBE version of the dataset will have a renderTypeName of
  // 'number' but will have the `format.view` property set to
  // 'percent_bar_and_text'. The `_isObePercentColumn()` test above will check
  // the `renderTypeName`; the `_isNbePercentColumn()` test below will check
  // the `format.view` property instead. We can't simply test for the
  // `format.view` property and handle both cases because percentages are
  // pre-multiplied in OBE but not in NBE.
  //
  // NBE datasets for which the origin OBE dataset had a 'percent' column have
  // the corresponding number column divided by 100 in the NBE copy.
  // Multiplying here by 100 brings the rendered values into parity.
  //
  // NOTE: The order of the checks for OBE/NBE below (first NBE, then OBE) is
  // important, since as of 6/27/2016 we force all queries through the NBE so
  // that we must assume that the value has been divided by 100.
  //
  // The path for OBE percentages is being left in place in case a decision is
  // made to intentionally support OBE queries as well.
  if (_isNbePercentColumn(column)) {
    return _renderPercentageNumber(amount * 100, format);
  } else if (_isObePercentColumn(column)) {
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
 * Renders an OBE-style location (an object with latitude and longitude
 * properties).
 */
function renderObeLocation(cellContent) {
  if (cellContent.hasOwnProperty('latitude') && cellContent.hasOwnProperty('longitude')) {
    return `(${cellContent.latitude}°, ${cellContent.longitude}°)`;
  }

  return '';
}

/**
* Renders a Point in plain text as a lat/lng pair.
*/
function renderGeoCell(cellContent) {
  const latitudeIndex = 1;
  const longitudeIndex = 0;
  const coordinates = _cellCoordinates(cellContent);
  if (coordinates) {
    return `(${coordinates[latitudeIndex]}°, ${coordinates[longitudeIndex]}°)`;
  } else {
    return '';
  }
}

/**
* Renders a Point wrapped in an HTML span element
*
* Parameters:
* - cellContent: data for the cell (from soda fountain).
*/
function renderGeoCellHTML(cellContent) {
  const latitudeIndex = 1;
  const longitudeIndex = 0;
  const coordinates = _cellCoordinates(cellContent);

  if (coordinates) {
    const latitudeTitle = I18n.translate('visualizations.common.latitude');
    const longitudeTitle = I18n.translate('visualizations.common.longitude');

    const latitude = `<span title="${latitudeTitle}">${coordinates[latitudeIndex]}°</span>`;
    const longitude = `<span title="${longitudeTitle}">${coordinates[longitudeIndex]}°</span>`;

    return `(${latitude}, ${longitude})`;
  } else {
    return '';
  }
}

/**
* Renders any GeoJSON column by serializing to Well Known Text.
*/
function renderWKTCell(cellContent) {
  return wkt.stringify(cellContent);
}

/**
* Render a numeric value as currency
*/
function renderMoneyCell(cellContent, column) {
  const format = _.extend(
    {
      currency: 'USD',
      decimalSeparator: '.',
      groupSeparator: ',',
      humane: 'false',
      precision: 2
    },
    column.format || {}
  );
  const getHumaneProperty = (formatToCheck) => {
    // So, the 'true/false'-ness of the humane property is actually serialized
    // as the string literals 'true' and 'false', not by actual boolean values
    // in the JSON response from the /api/views endpoint.
    //
    // Accordingly, we need to actually compare strings when deciding whether
    // or not to use 'humane' numbers as opposed to simply reading the value
    // out of the column format blob.
    //
    // Although this is expressed below as a not-equals comparison, the intent
    // is basically just to return the value false if the string matches
    // 'false' and the value true if it does not.
    return _.get(formatToCheck, 'humane', 'false').toLowerCase() !== 'false';
  };
  const currencySymbol = CURRENCY_SYMBOLS[format.currency];
  const amount = parseFloat(cellContent);

  if (_.isFinite(amount)) {
    if (getHumaneProperty(format)) {
      // We can't use formatNumber here because this use case is
      // slightly different — we want to enforce a certain precision,
      // whereas the normal humane numbers want to use the fewest
      // digits possible at all times.
      // The handling on thousands-scale numbers is also different,
      // because humane currency will always be expressed with the K
      // scale suffix, whereas our normal humane numbers allow four-
      // digit thousands output.
      const absVal = Math.abs(amount);

      if (absVal < 1000) {

        cellContent = absVal.
          toFixed(format.precision).
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
        const scaleGroupedVal = utils.commaify(Math.floor(absVal)).split(',');
        const symbols = ['K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y'];
        let symbolIndex = scaleGroupedVal.length - 2;

        let value = parseFloat(scaleGroupedVal[0] + '.' + scaleGroupedVal[1]);

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
      const commaifyOptions = {
        groupCharacter: format.groupSeparator,
        decimalCharacter: format.decimalSeparator
      };

      cellContent = utils.commaify(
        Math.abs(amount).toFixed(format.precision),
        commaifyOptions
      );
    }
    cellContent = `${amount < 0 ? '-' : ''}${currencySymbol}${cellContent}`;
  }

  return cellContent;
}

/**
* Render a url cell.
*/
function renderUrlCellHTML(cellContent) {
  if (!_.isEmpty(cellContent)) {
    const { url, description } = cellContent;
    return `<a href="${url}" target="_blank" rel="external">${description || url}</a>`;
  }

  return '';
}

/**
* Render an email cell.
*/
function renderEmailCellHTML(cellContent) {
  if (!_.isEmpty(cellContent)) {
    return `<a href="mailto:${cellContent}" target="_blank" rel="external">${cellContent}</a>`;
  }

  return '';
}

/**
* Render a phone cell.
*/
function renderPhoneCellHTML(cellContent) {
  if (!_.isEmpty(cellContent)) {
    const phoneNumber = _.get(cellContent, 'phone_number', '');
    const phoneHref = phoneNumber.replace(/[a-zA-Z]+: /, '');

    return `<a href="tel:${phoneHref}" target="_blank" rel="external">${phoneNumber}</a>`;
  }

  return '';
}

/**
* Render a photo cell.
*
* TODO: Remove this function once we don't need to support OBE datasets
*/
function renderPhotoCellHTML(cellContent, domain, datasetUid) {
  if (!_.isEmpty(cellContent)) {
    const href = `https://${domain}/views/${datasetUid}/files/${cellContent}`;
    return `<a href="${href}" target="_blank" rel="external">${cellContent}</a>`;
  }

  return '';
}

/**
* Render a document cell.
*
* TODO: Remove this function once we don't need to support OBE datasets
*/
function renderDocumentCellHTML(cellContent, domain, datasetUid) {
  if (!_.isEmpty(cellContent)) {
    const href = `https://${domain}/views/${datasetUid}/files/${cellContent.file_id}`;
    return `<a href="${href}" target="_blank" rel="external">${cellContent.filename}</a>`;
  }

  return '';
}

/**
* Render a multiple choice cell.
*
* TODO: Remove this function once we don't need to support OBE datasets
*/
function renderMultipleChoiceCell(cellContent, column) {
  if (!_.isEmpty(cellContent)) {
    const selectedOption = _.find(_.get(column, 'dropDown.values', []), function(option) {
      return _.isEqual(option.id, cellContent);
    });

    return selectedOption ? selectedOption.description : '';
  }

  return '';
}

/**
* Render a date or timestamp following column formatting, otherwise following defaults.
*/

const timeFormattings = {
  date_time: 'MM/DD/YYYY hh:MM:ss A',
  date: 'MM/DD/YYYY',
  date_dmy: 'DD/MM/YYYY',
  date_dmy_time: 'DD/MM/YYYY hh:MM:ss A',
  date_ymd: 'YYYY/MM/DD',
  date_ymd_time: 'YYYY/MM/DD hh:MM:ss A',
  date_monthdy: 'MMMM DD, YYYY',
  date_monthdy_shorttime: 'MMMM DD, YYYY hh:MM A',
  date_shortmonthdy: 'MMM DD, YYYY',
  date_monthdy_time: 'MMMM DD, YYYY hh:MM:ss A',
  date_dmonthy: 'DD MMMM YYYY',
  date_shortmonthdy_shorttime: 'MMM DD, YYYY hh:MM A',
  date_ymonthd: 'YYYY MMMM DD',
  date_ymonthd_time: 'YYYY MMMM DD hh:MM:ss A',
  date_my: 'MM/YYYY',
  date_ym: 'YYYY/MM',
  date_shortmonthy: 'MMM YYYY',
  date_yshortmonth: 'YYYY MMM',
  date_monthy: 'MMMM YYYY',
  date_ymonth: 'YYYY MMMM',
  date_y: 'YYYY'
};

function renderTimestampCell(cellContent, column) {
  if (_.isString(cellContent) || _.isNumber(cellContent)) {
    if (_.isNumber(cellContent)) {
      cellContent = (cellContent * 1000);
    }

    const time = moment(new Date(cellContent));
    const fallbackFormat = timeFormattings['date_time'];
    if (time.isValid()) {
      if (column.format && column.format.formatString) {
        // Option A: format using user-specified format string
        return time.format(column.format.formatString);
      } else if (column.format && column.format.view) {
        // Option B: format using preferred builtin style
        return time.format(timeFormattings[column.format.view] || fallbackFormat);
      } else if (time.hour() + time.minute() + time.second() + time.millisecond() === 0) {
        // Option C: infer date-only string format
        return time.format('YYYY MMM DD');
      } else {
        // Option D: use date-with-time format
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

function _isObePercentColumn(column) {
  return _.get(column, 'renderTypeName') === 'percent';
}

function _isNbePercentColumn(column) {

  return _.get(column, 'format.view') === 'percent_bar_and_text' &&
    _.get(column, 'renderTypeName') != 'percent';
}

function _renderCurrencyNumber(amount, format) {
  const isNegative = amount < 0;

  let value = Math.abs(amount);
  if (format.precision >= 0) {
    value = value.toFixed(format.precision);
  }

  value = utils.commaify(value, format.commaifyOptions);
  if (format.noCommas) {
    value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
  }

  const sign = isNegative ? '-' : '';

  return `${sign}${format.currency}${value}`;
}

function _renderFinancialNumber(amount, format) {
  const isNegative = amount < 0;

  let value = Math.abs(amount);
  if (format.precision >= 0) {
    value = value.toFixed(format.precision);
  }

  value = utils.commaify(value, format.commaifyOptions);
  if (format.noCommas) {
    value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
  }

  if (isNegative) {
    return `(${value})`;
  } else {
    return String(value);
  }
}

function _renderScientificNumber(amount, format) {
  const value =  amount.toExponential(format.precision);

  // no groups, so we can skip groupSeparator and commaify and noCommas
  return value.replace('.', format.decimalSeparator);
}

function _renderPercentageNumber(amount, format) {
  let value = amount;

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
  let value = amount;
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
  const maskChar = '#';
  let amountChars = String(amount).split('');
  let output = format.mask.slice(0, amountChars.length);

  while (output.indexOf(maskChar) > -1) {
    output = output.replace(maskChar, amountChars.shift());
  }
  output += amountChars.join('');

  return output;
}

function _cellCoordinates(cellContent) {
  const coordinates = _.get(cellContent, 'value.coordinates', cellContent.coordinates);
  return _.isArray(coordinates) ? coordinates : null;
}