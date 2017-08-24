import $ from 'jquery';
import _ from 'lodash';
const DataTypeFormatter = require('../views/DataTypeFormatter');

export function getColumnFormats(columns) {
  return _.reduce(columns, (acc, column) => {
    acc[column.fieldName] = _.pick(column, [
      'fieldName', 'name', 'dataTypeName', 'renderTypeName', 'format'
    ]);
    return acc;
  }, {});
}


// Formats a value from the dataset for rendering within the chart as HTML.
export function formatValueHTML(value, column, dataToRender, forceHumane = false) {
  const formatInfo = _.cloneDeep(_.get(dataToRender, `columnFormats.${column}`, {}));

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
    formatInfo.format = formatInfo.format || {};
    formatInfo.format.forceHumane = true;
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
