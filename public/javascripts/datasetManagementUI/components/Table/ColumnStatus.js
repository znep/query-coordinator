import React, { PropTypes } from 'react';

export const ColumnStatus = React.createClass({
  propTypes: {
    column: PropTypes.object.isRequired
  },

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps.column, this.props.column);
  },

  render() {
    const { column } = this.props;

    if (column.num_transform_errors === 1) {
      return (
        <th key={column.id} className="col-errors">
          <div>
            <span className="err-info error">{column.num_transform_errors}</span>
            {I18n.show_output_schema.column_header.error_exists}
          </div>
        </th>
      );
    } else if (column.num_transform_errors) {
      // TODO: Have a message for when errors are trickling in.
      return (
        <th key={column.id} className="col-errors">
          <div>
            <span className="err-info error">{column.num_transform_errors}</span>
            {I18n.show_output_schema.column_header.errors_exist}
          </div>
        </th>
      );
    } else if (column.contiguous_rows_processed) {
      // TODO: Only show this when all rows are good.
      return (
        <th key={column.id} className="col-errors">
          <div>
            <span className="err-info success socrata-icon-checkmark3" />
            {I18n.show_output_schema.column_header.no_errors_exist}
          </div>
        </th>
      );
    } else {
      return (
        <th key={column.id} className="col-errors">
          <div>
            <span className="err-info spinner-default" />
            {I18n.show_output_schema.column_header.scanning}
          </div>
        </th>
      );
    }
  }
});

// socrata-icon-checkmark3

export default ColumnStatus;
