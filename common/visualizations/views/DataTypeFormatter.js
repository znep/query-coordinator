const $ = require('jquery');
const _ = require('lodash');
const utils = require('common/js_utils');
const moment = require('moment');
// Converts GeoJSON formats to text
const wkt = require('wellknown');
const I18n = require('common/i18n').default;

// IMPORTANT NOTE: This module fails to localize some things correctly. It began
// as a port of Data Lens code, which took some serious shortcuts, and there has
// been insufficient motivation to redo formatting properly. For a clearer idea
// of what "properly" means, please see http://cldr.unicode.org for details.

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

const TIME_FORMATS = {
  date_time: 'MM/DD/YYYY hh:mm:ss A',
  date: 'MM/DD/YYYY',
  date_dmy: 'DD/MM/YYYY',
  date_dmy_time: 'DD/MM/YYYY hh:mm:ss A',
  date_ymd: 'YYYY/MM/DD',
  date_ymd_time: 'YYYY/MM/DD hh:mm:ss A',
  date_monthdy: 'MMMM DD, YYYY',
  date_monthdy_shorttime: 'MMMM DD, YYYY hh:mm A',
  date_shortmonthdy: 'MMM DD, YYYY',
  date_monthdy_time: 'MMMM DD, YYYY hh:mm:ss A',
  date_dmonthy: 'DD MMMM YYYY',
  date_dmonthy_time: 'DD MMMM YYYY hh:mm:ss A',
  date_shortmonthdy_shorttime: 'MMM DD, YYYY hh:mm A',
  date_ymonthd: 'YYYY MMMM DD',
  date_ymonthd_time: 'YYYY MMMM DD hh:mm:ss A',
  date_my: 'MM/YYYY',
  date_ym: 'YYYY/MM',
  date_shortmonthy: 'MMM YYYY',
  date_yshortmonth: 'YYYY MMM',
  date_monthy: 'MMMM YYYY',
  date_ymonth: 'YYYY MMMM',
  date_y: 'YYYY',
  // The following two formats are our default formats,
  // which match none of the existing custom formats.
  default_date_time: 'YYYY MMM DD hh:mm:ss A',
  default_date: 'YYYY MMM DD'
};

const PRECISION_FORMATS = {
  'year': 'date_y',
  'month': 'date_ym',
  'day': 'date_ymd'
};

// Please note: Functions whose name ends with HTML
// will return HTML ready to place into the DOM. Do
// not process further.
//
// SECURITY NOTE: If you modify any of these methods, ensure
// you don't introduce any XSS vulnerabilities. Write tests.
//
// SECURITY NOTE: Functions whose name ends with UnsafePlainText
// return unsafe strings. Do not place them into the DOM
// directly. Consider using an *HTML renderer.
module.exports = {
  // Before exporting any *UnsafePlainText functions, think
  // carefully about the potential security impact.
  renderCellHTML: renderCellHTML,
  renderBooleanCellHTML,
  renderNumberCellHTML,
  renderGeoCellHTML,
  renderMoneyCellHTML,
  renderUrlCellHTML,
  renderEmailCellHTML,
  renderPhoneCellHTML,
  renderBlobCellHTML,
  renderPhotoCellHTML,
  renderDocumentCellHTML,
  renderMultipleChoiceCellHTML,
  renderTimestampCellHTML,
  renderObeLocationHTML,
  renderFormattedTextHTML,
  getCellAlignment: getCellAlignment,
  applyCalendarDatePrecisionFormats
};

function renderCellHTML(cellContent, column, domain, datasetUid) {
  // SECURITY NOTE: Only return safe HTML from this function!
  let cellHTML;

  utils.assertIsOneOfTypes(column, 'object');
  utils.assertHasProperty(column, 'renderTypeName');

  if (_.isUndefined(cellContent)) {
    return '';
  }

  try {
    switch (column.renderTypeName) {
      case 'checkbox':
        cellHTML = renderBooleanCellHTML(cellContent, column);
        break;
      case 'number':
        cellHTML = renderNumberCellHTML(cellContent, column);
        break;
      case 'geo_entity':
        cellHTML = renderGeoCellHTML(cellContent);
        break;
      case 'point':
      case 'line':
      case 'polygon':
      case 'multipoint':
      case 'multiline':
      case 'multipolygon':
        cellHTML = renderWKTCellHTML(cellContent);
        break;
      case 'calendar_date':
        cellHTML = renderTimestampCellHTML(cellContent, column);
        break;
      case 'blob':
        cellHTML = renderBlobCellHTML(cellContent, domain, datasetUid);
        break;
      // OBE types that are deprecated on new datasets, but are supported on migrated datasets:
      case 'email':
        cellHTML = renderEmailCellHTML(cellContent);
        break;
      case 'money':
        cellHTML = renderMoneyCellHTML(cellContent, column);
        break;
      // OBE location columns are actually objects with latitude and longitude
      // keys or a coordinates key, so we need to handle them as a special case.
      case 'location':
        cellHTML = renderObeLocationHTML(cellContent);
        break;
      // EN-3548 - Note that only OBE datasets can have a column renderTypeName
      // of 'percent'. Corresponding NBE datasets will have a column
      // renderTypeName of 'number'. In order to keep that sort of logic somewhat
      // contained, inside of the implementation of `renderNumberCellUnsafePlainText()` we do a
      // few tests to figure out if we should be formatting the resulting value
      // as a percentage.
      case 'percent':
        cellHTML = renderNumberCellHTML(cellContent, column);
        break;
      case 'phone':
        cellHTML = renderPhoneCellHTML(cellContent);
        break;
      case 'url':
        cellHTML = renderUrlCellHTML(cellContent);
        break;

      // TODO: Remove these types once we no longer support OBE datasets
      // OBE types that are deprecated post-NBE migration:
      case 'date':
        cellHTML = renderTimestampCellHTML(cellContent, column);
        break;
      case 'document':
        cellHTML = renderDocumentCellHTML(cellContent, domain, datasetUid);
        break;
      case 'drop_down_list':
        cellHTML = renderMultipleChoiceCellHTML(cellContent, column);
        break;
      case 'html': // Formatted Text
        cellHTML = renderFormattedTextHTML(cellContent);
        break;
      case 'photo':
        cellHTML = renderPhotoCellHTML(cellContent, domain, datasetUid);
        break;

      default:
        cellHTML = _.escape(cellContent);
        break;
    }
  } catch (e) {
    console.error(`Error rendering ${cellContent} as type ${column.renderTypeName}:`);
    console.error(e);
  }

  return cellHTML;
}

/**
* Renders a formatted text column (only preserves plain text content).
*/
function renderFormattedTextHTML(cellContent) {
  return _.escape($(`<p>${cellContent}</p>`).text());
}

/**
* Renders a boolean value in checkbox format
*/
function renderBooleanCellHTML(cellContent) {
  return _.escape(_.isBoolean(cellContent) && cellContent ? '✓' : '');
}

/**
* Render a number based on column specified formatting.
* This has lots of possible options, so we delegate to helpers.
*/
function renderNumberCellUnsafePlainText(input, column) {
  // TODO: Floats are not ideal to use - our backend supports much more precision
  // than JavaScript numbers do. Consider something like BigNumber.
  const amount = parseFloat(input);
  const locale = utils.getLocale(window);
  const format = _.extend({
    precisionStyle: 'standard',
    precision: undefined,
    forceHumane: false, // NOTE: only used internally, cannot be set on columns
    noCommas: false,
    currency: I18n.t('shared.visualizations.charts.common.currency_symbol'),
    decimalSeparator: utils.getDecimalCharacter(locale),
    groupSeparator: utils.getGroupCharacter(locale),
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
* Render a number based on column specified formatting.
*/

function renderNumberCellHTML(input, column) {
  return renderNumberCellUnsafePlainText(input, column);
}

/**
 * Renders an OBE-style location (an object with latitude and longitude
 * properties).
 */
function renderObeLocationUnsafePlainText(cellContent) {
  let humanAddress = null;
  if (cellContent.human_address) {
    try {
      const addressData = JSON.parse(cellContent.human_address);
      const addressParts = [addressData.address, addressData.city, addressData.state, addressData.zip];
      humanAddress = addressParts.filter(_.identity).join(' ');
    } catch (e) {
      humanAddress = null;
    }
  }

  if (cellContent.hasOwnProperty('latitude') && cellContent.hasOwnProperty('longitude')) {
    const { longitude, latitude } = cellContent;
    return `${humanAddress ? (humanAddress + ' ') : ''}(${latitude}°, ${longitude}°)`;
  } else if (cellContent.hasOwnProperty('coordinates')) {
    const [ longitude, latitude ] = cellContent.coordinates;
    return `${humanAddress ? (humanAddress + ' ') : ''}(${latitude}°, ${longitude}°)`;
  } else if (humanAddress) {
    return humanAddress;
  } else {
    return '';
  }
}

/**
 * Renders an OBE-style location (an object with latitude and longitude
 * properties).
 */

function renderObeLocationHTML(cellContent) {
  return _.escape(renderObeLocationUnsafePlainText(cellContent));
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

  if (!coordinates) {
    return '';
  }

  const latitudeTitle = I18n.t('shared.visualizations.charts.common.latitude');
  const longitudeTitle = I18n.t('shared.visualizations.charts.common.longitude');

  const latitudeText = _.escape(`${coordinates[latitudeIndex]}`);
  const longitudeText = _.escape(`${coordinates[longitudeIndex]}`);

  const latitude = `<span title="${latitudeTitle}">${latitudeText}°</span>`;
  const longitude = `<span title="${longitudeTitle}">${longitudeText}°</span>`;

  return `(${latitude}, ${longitude})`;
}

/**
* Renders any GeoJSON column by serializing to Well Known Text.
*/
function renderWKTCellHTML(cellContent) {
  return _.escape(wkt.stringify(cellContent));
}

/**
* Render a blob cell.
*/
function renderBlobCellHTML(cellContent, domain, datasetUid) {
  if (_.isEmpty(cellContent)) {
    return '';
  }

  const href = `https://${domain}/views/${datasetUid}/files/${cellContent}`;
  return `<a href="${href}" target="_blank" rel="external">${_.escape(cellContent)}</a>`;
}

/**
* Render a numeric value as currency
*/
function renderMoneyCellHTML(cellContent, column) {
  const locale = utils.getLocale(window);
  const format = _.extend(
    {
      currency: utils.getCurrency(locale),
      decimalSeparator: utils.getDecimalCharacter(locale),
      groupSeparator: utils.getGroupCharacter(locale),
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
    const isNegative = amount < 0;

    if (getHumaneProperty(format) || format.forceHumane) {
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
        const scaleGroupedVal = utils.commaify(Math.floor(absVal)).split(format.groupSeparator);
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

    const sign = isNegative ? '-' : '';

    cellContent = `${currencySymbol}${sign}${cellContent}`;
  }

  return _.escape(cellContent);
}

/**
* Render a url cell.
*/
function renderUrlCellHTML(cellContent) {
  if (_.isEmpty(cellContent)) {
    return '';
  }

  if (_.isString(cellContent)) {
    return `<a href="${_.escape(cellContent)}" target="_blank" rel="external">${_.escape(cellContent)}</a>`;
  } else {
    const { url, description } = cellContent;
    const text = _.escape(description || url);
    return `<a href="${url}" target="_blank" rel="external">${text}</a>`;
  }
}

/**
* Render an email cell.
*/
function renderEmailCellHTML(cellContent) {
  if (_.isEmpty(cellContent)) {
    return '';
  }

  return `<a href="mailto:${cellContent}" target="_blank" rel="external">${_.escape(cellContent)}</a>`;
}

/**
* Render a phone cell.
*/
function renderPhoneCellHTML(cellContent) {
  if (_.isEmpty(cellContent)) {
    return '';
  }

  // Only permit digits, spaces, and selected punctuation.
  // This is *NOT* validated on the backend; XSS mitigation for EN-18885.
  const filterDisallowed = (raw) => {
    return (raw || '').replace(/[^\d\s(),.+*#-]/g, '').trim();
  };

  if (_.isString(cellContent)) {
    return `<a href="tel:${filterDisallowed(cellContent)}" target="_blank" rel="external">${_.escape(cellContent)}</a>`;
  } else {
    const phoneNumber = _.get(cellContent, 'phone_number', '');
    return `<a href="tel:${filterDisallowed(phoneNumber)}" target="_blank" rel="external">${_.escape(phoneNumber)}</a>`;
  }

}

/**
* Render a photo cell.
*
* TODO: Remove this function once we don't need to support OBE datasets
*/
function renderPhotoCellHTML(cellContent, domain, datasetUid) {
  if (_.isEmpty(cellContent)) {
    return '';
  }

  const href = `https://${domain}/views/${datasetUid}/files/${cellContent}`;
  return `<a href="${href}" target="_blank" rel="external">${_.escape(cellContent)}</a>`;
}

/**
* Render a document cell.
*
* TODO: Remove this function once we don't need to support OBE datasets
*/
function renderDocumentCellHTML(cellContent, domain, datasetUid) {
  if (_.isEmpty(cellContent)) {
    return '';
  }

  const href = `https://${domain}/views/${datasetUid}/files/${cellContent.file_id}`;
  return `<a href="${href}" target="_blank" rel="external">${_.escape(cellContent.filename)}</a>`;
}

/**
* Render a multiple choice cell.
*
* TODO: Remove this function once we don't need to support OBE datasets
*/
function renderMultipleChoiceCellHTML(cellContent, column) {
  if (_.isEmpty(cellContent)) {
    return '';
  }

  const selectedOption = _.find(_.get(column, 'dropDown.values', []), function(option) {
    return _.isEqual(option.id, cellContent);
  });

  return _.escape(selectedOption ? selectedOption.description : '');
}

/**
* Render a date or timestamp following column formatting, otherwise following defaults.
*/


function renderTimestampCellUnsafePlainText(cellContent, column) {
  if (!_.isString(cellContent) && !_.isNumber(cellContent)) {
    return '';
  }

  if (_.isNumber(cellContent)) {
    // If we receive seconds, convert to milliseconds.
    cellContent = (cellContent * 1000);
  }

  const time = moment(cellContent);
  if (!time.isValid()) {
    return '';
  }

  const formatString = _.get(column, 'format.formatString');
  const formatStyle = _.get(column, 'format.view');

  if (formatString) {
    // Option A: format using user-specified format string
    return time.format(formatString);

  } else if (formatStyle) {
    // Option B: format using preferred builtin style
    const fallbackFormat = TIME_FORMATS.date_time;
    return time.format(TIME_FORMATS[formatStyle] || fallbackFormat);

  } else if (time.hour() + time.minute() + time.second() + time.millisecond() === 0) {
    // Option C: infer date-only string format when the time is exactly midnight
    return time.format(TIME_FORMATS.default_date);

  } else {
    // Option D: use date-with-time format
    return time.format(TIME_FORMATS.default_date_time);

  }
}

/**
* Render a date or timestamp following column formatting, otherwise following defaults.
*/

function renderTimestampCellHTML(cellContent, column) {
  return _.escape(renderTimestampCellUnsafePlainText(cellContent, column));
}

function getCellAlignment(column) {
  if (column.format && column.format.align) {
    return column.format.align;
  }

  switch (column.renderTypeName) {
    case 'number':
    case 'money':
    case 'percent':
    case 'star':
      return 'right';

    case 'checkbox':
      return 'center';

    default:
      return 'left';
  }
}

function applyCalendarDatePrecisionFormats(formats, precision) {
  const precisionFormat = PRECISION_FORMATS[precision];

  if (_.isEmpty(precisionFormat)) {
    return;
  }

  const calendarFormats = _.filter(formats, (format) => (format.dataTypeName === 'calendar_date'));
  _.each(calendarFormats, (calendarFormat) => calendarFormat.format.view = precisionFormat);
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

  if (format.forceHumane) {
    value = utils.formatNumber(value, format);
  } else {
    if (format.precision >= 0) {
      value = value.toFixed(format.precision);
    }

    value = utils.commaify(value, format.commaifyOptions);
    if (format.noCommas === true || format.noCommas === "true") {
      value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
    }
  }

  const sign = isNegative ? '-' : '';

  return `${format.currency}${sign}${value}`;
}

function _renderFinancialNumber(amount, format) {
  const isNegative = amount < 0;

  let value = Math.abs(amount);

  if (format.forceHumane) {
    value = utils.formatNumber(value, format);
  } else {
    if (format.precision >= 0) {
      value = value.toFixed(format.precision);
    }

    value = utils.commaify(value, format.commaifyOptions);
    if (format.noCommas === true || format.noCommas === "true") {
      value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
    }
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

  if (format.forceHumane) {
    value = utils.formatNumber(value, format);
  } else {
    if (format.precision >= 0) {
      value = value.toFixed(format.precision);
    }

    value = utils.commaify(value, format.commaifyOptions);

    if (format.noCommas === true || format.noCommas === "true") {
      value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
    }
  }

  return value + '%';
}

function _renderStandardNumber(amount, format) {
  let value = amount;

  if (format.forceHumane) {
    value = utils.formatNumber(value, format);
  } else {
    if (format.precision >= 0) {
      value = value.toFixed(format.precision);
    }

    value = utils.commaify(value, format.commaifyOptions);

    if (format.noCommas === true || format.noCommas === "true") {
      value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
    }
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
