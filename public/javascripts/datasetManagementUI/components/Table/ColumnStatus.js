import _ from 'lodash';
import React, { PropTypes } from 'react';
import ProgressBar from '../ProgressBar';
import classNames from 'classnames';

export const ColumnStatus = React.createClass({
  propTypes: {
    column: PropTypes.object.isRequired,
    totalRows: PropTypes.number
  },

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps, this.props);
  },

  render() {
    const { column, totalRows } = this.props;
    const SubI18n = I18n.show_output_schema.column_header;
    const uploadDone = _.isNumber(totalRows);
    const thisColumnDone = _.isNumber(totalRows) && column.contiguous_rows_processed === totalRows;

    const rowsProcessed = column.contiguous_rows_processed || 0;
    const percentage = Math.round(rowsProcessed / totalRows * 100);

    const progressBarClassName = classNames(
      'column-progress-bar',
      { 'column-progress-bar-done': !uploadDone || thisColumnDone }
    );
    const progressBar = (
      <div className={progressBarClassName}>
        <ProgressBar percent={percentage} ariaLabel={column.display_name} />
      </div>
    );

    if (column.num_transform_errors === 1) {
      const msg = thisColumnDone ?
        SubI18n.error_exists :
        SubI18n.error_exists_scanning;
      return (
        <th key={column.id} className="col-errors">
          {progressBar}
          <div className="column-status-text">
            <span className="err-info error">{column.num_transform_errors}</span>
            {msg}
          </div>
        </th>
      );
    } else if (column.num_transform_errors) {
      const msg = thisColumnDone ?
        SubI18n.errors_exist :
        SubI18n.errors_exist_scanning;
      return (
        <th key={column.id} className="col-errors">
          {progressBar}
          <div className="column-status-text">
            <span className="err-info error">{column.num_transform_errors}</span>
            {msg}
          </div>
        </th>
      );
    } else {
      if (thisColumnDone) {
        return (
          <th key={column.id} className="col-errors">
            {progressBar}
            <div className="column-status-text">
              <span className="err-info success socrata-icon-checkmark3" />
              {SubI18n.no_errors_exist}
            </div>
          </th>
        );
      } else {
        return (
          <th key={column.id} className="col-errors">
            {progressBar}
            <div className="column-status-text">
              <span className="err-info spinner-default" />
              {SubI18n.scanning}
            </div>
          </th>
        );
      }
    }
  }
});

export default ColumnStatus;
