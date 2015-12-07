(function() {
  this.a11y = {
    top_list_summary: function() {

    },

    table_summary: function(options) {
      if(_.isEmpty(options['columns']) || _.is_Empty(options['rows'])) {
        return $.t('table.no_summary_available');
      }

      var row_headings = '';

      if(options['rows'].length < 5) {
        row_headings = rows.join(', ');
      }

      template_opts = {
        data_description: options['table_description'],
        column_heading_count: options['columns'].size,
        column_headings: options['columns'].join(', '),
        row_heading_count : options['rows'].length,
        row_headings: row_headings
      }
    }
  };
})();
