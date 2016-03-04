const angular = require('angular');
function FeatureMapService(DataTypeFormatService, linkyFilter) {

  function formatRowInspectorQueryResponse(data) {
    // Extract and format titles from the provided data
    // Note that this is intentionally mutating the
    // provided data!
    var titles = extractAndFormatTitles(data);

    // Format the remaining, non-title columns
    var rows = formatRows(data);

    return {
      rows: rows,
      titles: titles
    };
  }

  // Note that this mutates the provided rows, intentionally!
  function extractAndFormatTitles(rows) {
    // Extract row titles from each row if present
    // before giving the rows to the flannel's scope for rendering.
    var titles = [];
    var customTitles = [];
    var useDefaultTitles = false;

    rows.map(function(row) {
      // remove any columns where isTitleColumn is true and push
      // the first of those columns into customTitles
      var title = _.remove(row, 'isTitleColumn');
      customTitles.push(title[0]);
    });

    if (_.find(customTitles, _.isDefined)) {
      titles = customTitles;
    } else {
      // If no row titles are specified, extract default row titles
      // (those from the column used to produce the current feature map),
      // and set flannel to use default titles.
      rows.map(function(row) {
        var title = _.remove(row, 'isFeatureMapColumn');
        titles.push(title[0]);
      });
      useDefaultTitles = true;
    }

    return titles.map(function(title) {
      return formatTitles(title, useDefaultTitles);
    });
  }

  // Compile a formatted row title from the given title column or lack thereof.
  function formatTitles(titleColumn, useDefaultTitles) {
    if (_.isUndefined(titleColumn)) {
      return;
    } else if (useDefaultTitles) {
      // defaults are lat/lng coordiantes from a location column, which we
      // can count on being accessible in this way
      var coordinates = formatContentByType(titleColumn.value[0], titleColumn, true);
      return coordinates;
    } else {
      var title = formatValue(titleColumn, true);
      return _.isString(title) ? title.toUpperCase() : title;
    }
  }

  // Format an array of subcolumns under a given parent column
  function formatRows(data) {
    return data.map(function(row) {
      return row.map(function(column) {
        return {
          column: column.columnName,
          value: formatValue(column, false)
        };
      });
    });
  }

  function canDisplayAddressItem(item) {
    return _.isDefined(item) && !_.isObject(item) && !_.isArray(item);
  }


  function formatValue(column, isTitle) {
    if (_.isNull(column.value)) {
      return '';
    }

    isTitle = isTitle || false;

    // Format cell value if it is a single column without subcolumns
    if (!column.isParentColumn) {
      return formatContentByType(column.value[0], column, isTitle);
    }

    // Otherwise, the column is a parent column.
    // Process its subcolumns, formatting and arranging each value acccordingly.
    var subColumns = column.value;
    var formattedColumnData;

    // If it is a location column with only coordinates, format that directly.
    if (subColumns.length === 1 && _.has(subColumns[0], 'coordinates')) {
      // Take into account if the data represents the title, in which coordinates should not
      // be represented with parentheses.
      formattedColumnData = formatContentByType(subColumns[0], column, isTitle);
    }

    // Otherwise process subcolumns based on the parent column's type.
    switch (column.renderTypeName) {
      case 'location':
        var addressColumns = _.map(['address', 'city', 'state', 'zip'], function(addressColumn) {
          var columnValue = _.result(_.find(subColumns, { columnName: addressColumn }), 'value');
          return _.isString(columnValue) ? columnValue.trim() : columnValue;
        });

        // Format address following US postal format if any of its components are present
        if (_.any(addressColumns, _.isPresent)) {
          var address = addressColumns[0];
          var city = addressColumns[1];
          var state = addressColumns[2];
          var zip = addressColumns[3];

          var canDisplayCity = canDisplayAddressItem(city);
          var canDisplayState = canDisplayAddressItem(state);
          var canDisplayZip = canDisplayAddressItem(zip);

          var addressLines = [];

          if (canDisplayAddressItem(address)) {
            addressLines.push(address);
          }

          if (canDisplayCity && canDisplayState && canDisplayZip) {
            addressLines.push(`${city}, ${state} ${zip}`);
          } else if (canDisplayState && canDisplayZip) {
            addressLines.push(`${state} ${zip}`);
          } else if (canDisplayCity && canDisplayState) {
            addressLines.push(`${city}, ${state}`);
          }

          formattedColumnData = addressLines.join('\n');
        } else {
          // As a back up, just display the coordinates
          formattedColumnData = formatContentByType(subColumns[0], column, isTitle);
        }
        break;
      case 'phone':
        // Just return the phone number, not its type
        // Given that this is stored with the parent column, it will be the
        // first subcolumn stored
      case 'url':
        // Just return the url, not its description
        // Given that this is stored with the parent column, it will be the
        // first subcolumn stored.
      default:
        // If an unexpected subcolumn comes up, format and display
        // the value of its parent column only, not its subcolumns.
        formattedColumnData = formatContentByType(subColumns[0].value, subColumns[0], isTitle);
        break;

        // Other possible default behavior:

        // If an unexpected column and subcolumns are encountered,
        // list 'name: value' for each subcolumn
        // formattedColumnData = subColumns.
        //   map(function(subColumn) {
        //     return '{0}: {1}'.format(
        //       subColumn.columnName,
        //       formatContentByType(subColumn.value, column)
        //     );
        //   }).
        //   join(', ');
        // break;
    }
    return formattedColumnData;
  }

  // Format content based on data type
  function formatContentByType(content, column, isTitle) {
    if (_.isNull(column.value)) {
      return '';
    }

    isTitle = isTitle || false;

    var isLatLng = column.physicalDatatype === 'point' || column.physicalDatatype === 'geo_entity';

    var datatypeToFormat = {
      'boolean': DataTypeFormatService.renderBooleanCell(content, column),
      'number': DataTypeFormatService.renderNumberCell(content, column),
      'geo_entity': DataTypeFormatService.renderGeoCell(content, column),
      'point': DataTypeFormatService.renderGeoCell(content, column),
      'timestamp': DataTypeFormatService.renderTimestampCell(content, column),
      'floating_timestamp': DataTypeFormatService.renderTimestampCell(content, column),
      'money': DataTypeFormatService.renderMoneyCell(content, column),
      'text': _.isString(content) ? linkyFilter(content, '_blank') : content
    };

    var formattedContent = _.get(datatypeToFormat, column.physicalDatatype, content);
    if (isTitle && isLatLng) {
      formattedContent = formattedContent.replace(/[()]/g, '');
    }

    return DOMPurify.sanitize(formattedContent, {
      ALLOWED_TAGS: ['a'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });
  }

  return {
    formatRowInspectorQueryResponse: formatRowInspectorQueryResponse
  };
}

angular.
  module('dataCards.services').
    factory('FeatureMapService', FeatureMapService);
