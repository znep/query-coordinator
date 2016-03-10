require('socrata-visualizations').Table;
require('./styles/table.scss');

module.exports = function(values, $target) {
  'use strict';

  var tableVIF = {
    'aggregation': {
      'columnName': null,
      'function': 'count'
    },
    'columnName': values.columnName,
    'configuration': {
      'localization': {
        'PREVIOUS': 'Previous',
        'NEXT': 'Next',
        'NO_ROWS': 'No {unitOther}',
        'ONLY_ROW': 'Showing {unitOne} {firstRowOrdinal} of {datasetRowCount}',
        'MANY_ROWS': 'Showing {unitOther} {firstRowOrdinal}-{lastRowOrdinal} out of {datasetRowCount}',
        'LATITUDE': 'Latitude',
        'LONGITUDE': 'Longitude',
        'NO_COLUMN_DESCRIPTION': 'No description provided.'
      },
      'order': [{
        ascending: true,
        columnName: values.columnName
      }]
    },
    'createdAt': '2014-01-01T00:00:00',
    'datasetUid': values.datasetUid,
    'domain': values.domain,
    'filters': [],
    'format': {
      'type': 'visualization_interchange_format',
      'version': 1
    },
    'origin': {
      'type': 'test_data',
      'url': 'localhost'
    },
    'title': values.columnName,
    'type': 'table',
    'unit': {
      'one': 'case',
      'other': 'cases'
    }
  };

  var $tableElement = $target;
  $tableElement.socrataTable(tableVIF);

  function handleFiltersUpdated(event, data) {
    tableVIF.filters = data.filters;

    var changeEvent = jQuery.Event('SOCRATA_VISUALIZATION_RENDER_VIF'); // eslint-disable-line
    changeEvent.originalEvent.detail = tableVIF;

    $tableElement.trigger(changeEvent);
  }

  $(document).on('appliedFilters.qfb.socrata', handleFiltersUpdated);
};
