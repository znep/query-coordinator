(function() {
  'use strict';

  window.a11y = {
    tableSummary: function(options) {
      if (_.isEmpty(options.columns) || _.isEmpty(options.rows)) {
        return $.t('table.no_summary_available');
      }

      var rowHeadings = '';

      if (_.size(options, 'rows') < 5) {
        rowHeadings = _.get(options, 'rows', []).join(', ');
      }

      var templateOptions = {
        'data_description': _.get(options, 'tableDescription', ''),
        'column_heading_count': options.columns.length,
        'column_headings': _.get(options, 'columns', []).join(', '),
        'row_heading_count': options.rows.length,
        'row_headings': rowHeadings
      };

      return $.t('table.summary', templateOptions);
    }
  };
})();
