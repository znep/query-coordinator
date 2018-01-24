const $ = require('jquery');
const _ = require('lodash');
const utils = require('common/js_utils');
const moment = require('moment');
const BigNumber = require('bignumber.js');
// Converts GeoJSON formats to text
const wkt = require('wellknown');
const I18n = require('common/i18n').default;

BigNumber.config({ ERRORS: false });

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
  getCurrencySymbol,
  // Before exporting any *UnsafePlainText functions, think
  // carefully about the potential security impact.
  renderCellHTML,
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
  getCellAlignment,
  getCellConditionalFormattingStyles
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
        cellHTML = maybeRenderTextFormattingHTML(cellContent, column);
        break;
    }
  } catch (e) {
    console.error(`Error rendering ${cellContent} as type ${column.renderTypeName}:`);
    console.error(e);
  }

  return cellHTML;
}

/**
 * Applies formatting to text columns (e.g. email addresses)
 */
function maybeRenderTextFormattingHTML(cellContent, column) {

  if (!_.isString(cellContent) || _.isEmpty(cellContent)) {
    return '';
  }

  const escapedCellContent = _.escape(cellContent);
  let cellHTML = '';

  switch (_.get(column, 'format.displayStyle', '').toLowerCase()) {

    case 'email':
      cellHTML = `<a href="mailto:${escapedCellContent}" title="${escapedCellContent}">${escapedCellContent}</a>`;
      break;

    case 'url':
      const protocol = cellContent.match(/^([a-z]+:\/\/)/i);

      // If there is no protocol it won't be a valid link anyway, so just render it as a string.
      if (_.isNull(protocol)) {
        cellHTML = escapedCellContent;
      } else {
        cellHTML = `<a href="${escapedCellContent}" title="${escapedCellContent}">${escapedCellContent}</a>`;
      }
      break;

    default:
      cellHTML = escapedCellContent;
      break;
  }

  return cellHTML;
}

/**
* Renders a formatted text column (only preserves plain text content).
*/
function renderFormattedTextHTML(cellContent) {

  return (_.isNull(cellContent)) ?
    '' :
    _.escape($(`<p>${cellContent}</p>`).text());
}

/**
* Renders a boolean value in checkbox format
*/
function renderBooleanCellHTML(cellContent) {
  return _.escape(_.isBoolean(cellContent) && cellContent ? '✓' : '');
}

function getCurrencySymbol(format) {
  // For the purposes of getting a currency symbol, we NEVER want it to return undefined.
  // Not sure if we should default the symbol to $, but it's likely to end up that way from I18n.
  let localeDefault = I18n.t('shared.visualizations.charts.common.currency_symbol', { defaultValue: '' });
  if (!format) {
    return localeDefault;
  }
  // Direction from Chris L. is to use currencyStyle as primary field, fallback to currency, then locale default.
  const currency = format.currencyStyle || format.currency;
  return CURRENCY_SYMBOLS[currency] || localeDefault;
}

/**
* Render a number based on column specified formatting.
* This has lots of possible options, so we delegate to helpers.
*/
function renderNumberCellUnsafePlainText(input, column) {
  const amount = parseFloat(input);

  // EN-19953 - Data Inconsistencies in Grid View Refresh
  //
  // Although we were able to mostly pretend that invalid data did not
  // exist when we were working on Stories and VizCan, it turns out that
  // quite a few customer datasets have invalid data that they expect
  // to be rendered as an empty cell and not, e.g., 'NaN'.
  //
  // In this case we will avoid rendering 'NaN' to table cells by only
  // actually trying to render the number if the column we are rendering
  // is of type number but the value we are looking is not finite by
  // to lodash's determination.
  if (!_.isFinite(amount)) {
    return '';
  }

  // Initialize BigNumber with string to deal with a limitation of
  // 15 significant digits. https://github.com/MikeMcl/bignumber.js/issues/11
  const safeAmount = new BigNumber(String(input));
  const locale = utils.getLocale(window);
  const format = _.extend({
    precisionStyle: 'standard',
    precision: undefined,
    forceHumane: false, // NOTE: only used internally, cannot be set on columns
    noCommas: false,
    decimalSeparator: utils.getDecimalCharacter(locale),
    groupSeparator: utils.getGroupCharacter(locale),
    mask: null
  }, column.format || {});

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
    if (_.isNil(safeAmount)) {
      // This case *should* be unreachable, so we'll log and render something
      // obviously wrong if we hit this branch.
      console.error(`Unable to create BigNumber from the following: ${input}`);
      return 'NaN';
    }

    return _renderPercentageNumber(safeAmount.times(100), format);
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

  if (_.isNull(cellContent)) {
    return '';
  }

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
    const [longitude, latitude] = cellContent.coordinates;
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

  if (_.isEmpty(cellContent)) {
    return '';
  } else if (_.isString(cellContent)) {
    return _.escape(cellContent);
  } else {
    return _.escape(wkt.stringify(cellContent));
  }
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
  const currencySymbol = getCurrencySymbol(format);
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

  const selectedOption = _.find(_.get(column, 'dropDownList.values', []), function(option) {
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

  let time;

  // EN-18426 - Grouping on year in an FCC dataset returns unexpected results
  //
  // When we do aggregations involving a date_trunc or whatever we return timestamp
  // dates that are equivalent to "YYYY-01-01T00:00:00Z". This causes ther timestamp
  // renderer to display results in the browser's timezone that are incorrect (e.g.
  // an aggregation on year will always show the actual grouping year - 1 for users
  // that are on the negative side of zulu time. This is because all dates are
  // converted to UTC by the backend in order to do the aggregation.
  //
  // One fix for this, which is implemented below, is to treat the value as UTC if
  // we know that the column is aggregated, which will cause the rendering to show
  // the correct grouping value instead of the one represented in the browser's
  // local timezone.
  const treatAggregatedDatesAsUTC = _.get(window, 'blist.feature_flags.treat_aggregated_dates_as_utc', false);
  const columnIsAggregated = _.get(column, 'format.group_function', false);

  if (treatAggregatedDatesAsUTC && columnIsAggregated) {
    time = moment(cellContent).utc();
  } else {
    time = moment(cellContent);
  }

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

function getCellConditionalFormattingStyles(cellContent, column, conditionalFormattingRules) {
  const tableColumnId = _.get(column, 'tableColumnId', -1);
  const getStylesForRule = (rule) => {
    return `background-color:${_.get(rule, 'color', '#fff')};`;
  };

  let styles = '';

  if (!_.isArray(conditionalFormattingRules)) {
    return styles;
  }

  for (let i = 0; i < conditionalFormattingRules.length; i++) {
    let rule = conditionalFormattingRules[i];

    // A single, global rule.
    if (_.isBoolean(rule.condition) && _.isString(rule.color) && rule.condition) {

      styles = getStylesForRule(rule);
      break;
    } else {

      const ruleOperator = _.get(rule, 'condition.operator', null);

      if (!_.get(rule, 'condition', {}).hasOwnProperty('children')) {

        _.set(
          rule,
          'condition.children',
          [
            {
              operator: _.get(rule, 'condition.operator', ''),
              tableColumnId: _.get(rule, 'condition.tableColumnId', -1),
              value: _.get(rule, 'condition.value', '')
            }
          ]
        );
      }

      const matches = _.get(rule, 'condition.children', []).map(function(condition) {
        const conditionOperator = _.get(condition, 'operator', null);

        if (_.get(condition, 'tableColumnId', -1) !== tableColumnId) {
          return false;
        }

        if (conditionOperator === 'IS_BLANK' && _.isNull(cellContent)) {
          return true;
        }

        if (conditionOperator === 'IS_NOT_BLANK' && !_.isNull(cellContent)) {
          return true;
        }

        const subColumn = _.get(condition, 'subcolumn', null);
        const conditionValue = _.get(condition, 'value', null);

        let cellValue;

        switch (_.get(column, 'dataTypeName', null)) {

          case 'number':
          case 'money':
          case 'percent':
          case 'date':
          case 'stars':
            cellValue = parseFloat(cellContent);
            break;

          default:
            cellValue = cellContent;
            break;
        }

        if (_.isString(subColumn)) {
          cellValue = _.get(cellContent, subColumn, null);
        }

        switch (conditionOperator) {
          case 'EQUALS':
            return _.isEqual(conditionValue, cellValue);
          case 'NOT_EQUALS':
            return !_.isEqual(conditionValue, cellValue);
          case 'STARTS_WITH':
            return new RegExp('^' + _.escapeRegExp(conditionValue)).test(cellValue);
          case 'CONTAINS':
            return new RegExp(_.escapeRegExp(conditionValue)).test(cellValue);
          case 'NOT_CONTAINS':
            return !(new RegExp(_.escapeRegExp(conditionValue)).test(cellValue));
          case 'LESS_THAN':
            return cellValue < conditionValue;
          case 'LESS_THAN_OR_EQUALS':
            return cellValue <= conditionValue;
          case 'GREATER_THAN':
            return cellValue > conditionValue;
          case 'GREATER_THAN_OR_EQUALS':
            return cellValue >= conditionValue;
          case 'BETWEEN':
            return (cellValue > conditionValue[0] && cellValue < conditionValue[1]);
          case 'IS_BLANK':
          case 'IS_NOT_BLANK':
          default:
            return false;
        }
      });

      if (ruleOperator === 'and' && matches.indexOf(false) < 0) {

        styles = getStylesForRule(rule);
        break;
      } else if (ruleOperator !== 'and' && matches.indexOf(true) >= 0) {

        styles = getStylesForRule(rule);
        break;
      }
    }
  }

  return styles;
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
    if (format.noCommas === true || format.noCommas === 'true') {
      value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
    }
  }

  const sign = isNegative ? '-' : '';

  const currencySymbol = getCurrencySymbol(format);
  return `${currencySymbol}${sign}${value}`;
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
    if (format.noCommas === true || format.noCommas === 'true') {
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
  const value = amount.toExponential(format.precision);

  // no groups, so we can skip groupSeparator and commaify and noCommas
  return value.replace('.', format.decimalSeparator);
}

function _renderPercentageNumber(amount, format) {
  let value = amount;

  if (format.forceHumane) {
    value = utils.formatNumber(parseFloat(value), format);
  } else {
    if (format.precision >= 0) {
      value = value.toFixed(format.precision);
    }

    value = utils.commaify(value, format.commaifyOptions);

    if (format.noCommas === true || format.noCommas === 'true') {
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

    if (format.noCommas === true || format.noCommas === 'true') {
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
