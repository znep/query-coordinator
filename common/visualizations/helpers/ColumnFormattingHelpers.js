import $ from 'jquery';
import _ from 'lodash';
const DataTypeFormatter = require('../views/DataTypeFormatter');

const PRECISION_FORMATS = {
  'year': 'date_y',
  'month': 'date_ym',
  'day': 'date_ymd'
};

export function getColumnFormats(columns) {
  return _.reduce(columns, (acc, column) => {
    acc[column.fieldName] = _.pick(column, [
      'fieldName', 'name', 'dataTypeName', 'renderTypeName', 'format'
    ]);
    return acc;
  }, {});
}

export function createMoneyFormatter(column, dataToRender) {
  const formatInfo = _.cloneDeep(_.get(dataToRender, `columnFormats.${column}`, {}));
  // Using fixed precision caused rounding errors, so we are letting precision
  // get determined by the general renderNumberCellHTML.
  delete formatInfo.format.precision;
  formatInfo.format.forceHumane = true;
  const formatter = (d) => {
    const v = DataTypeFormatter.renderNumberCellHTML(d, formatInfo);
    return `${DataTypeFormatter.CURRENCY_SYMBOLS[formatInfo.format.currency]}${v}`;
  };

  return formatter;
}

// Formats a value from the dataset for rendering within the chart as HTML.
export function formatValueHTML(value, columnName, dataToRender, forceHumane = false) {
  // NOTE: Seems kind of expensive to do a cloneDeep on every single format call.
  const formatInfo = _.cloneDeep(_.get(dataToRender, `columnFormats.${columnName}`, {}));

  if (!formatInfo.renderTypeName) {
    formatInfo.renderTypeName = 'number';
  }

  if (forceHumane) {
    // There are certain circumstances where we want to always abbreviate
    // numbers (with the "humane" suffixes K, M, B, T, etc.); however, our
    // existing humane number formatter doesn't understand how to use column
    // formatting concepts like currency or percents. So instead, I decided to
    // add support for forcing "humane" formatting in DataTypeFormatter.
    // IMPORTANT: forceHumane is the only formatting property which is purely
    // determined by our application code (i.e. not directly set by a user).
    _.set(formatInfo, 'format.forceHumane', true);
  }

  if (dataToRender.precision) {
    // Having a precision ('year', 'month' or 'day') allows us to return a
    // format string for calendar_date that is appropriate to the precision.
    // For instance, a precision of 'year' should only render a year like '2017'.
    // A precision of 'month', should only render year and month like '2017/01'.
    const precisionFormat = PRECISION_FORMATS[dataToRender.precision];

    if (precisionFormat && (formatInfo.dataTypeName === 'calendar_date')) {
      _.set(formatInfo, 'format.view', precisionFormat);
    }
  }

  return DataTypeFormatter.renderCellHTML(value, formatInfo);
}

// Formats a value from the dataset for rendering within the chart as plain text.
export function formatValuePlainText(value, column, dataToRender, forceHumane = false) {
  // This is a very brain-dead solution. However, it works safely and keeps us
  // from maintaining separate plain/html renderers for each column type.
  return $('<div>').
    html(formatValueHTML(value, column, dataToRender, forceHumane)).
    text();
}
