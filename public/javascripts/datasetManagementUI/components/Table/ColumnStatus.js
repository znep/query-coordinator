import _ from 'lodash';
import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router';
import * as Links from '../../links';
import { singularOrPlural } from '../../lib/util';
import styleguide from 'socrata-components';
import ProgressBar from '../ProgressBar';
import TypeIcon from '../TypeIcon';

export const ColumnStatus = React.createClass({
  propTypes: {
    column: PropTypes.object.isRequired,
    errorsColumnId: PropTypes.number,
    path: PropTypes.object.isRequired,
    totalRows: PropTypes.number
  },

  componentDidMount() {
    this.attachFlyouts();
  },

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps, this.props);
  },

  componentDidUpdate() {
    this.attachFlyouts();
  },

  getFlyoutId() {
    return `column-status-flyout-${this.props.column.id}`;
  },

  attachFlyouts() {
    const element = document.getElementById(this.getFlyoutId());
    if (element) {
      styleguide.attachTo(element.parentNode);
    }
  },

  render() {
    const { column, totalRows, path, errorsColumnId } = this.props;
    const SubI18n = I18n.show_output_schema.column_header;
    const uploadDone = _.isNumber(totalRows);
    const thisColumnDone = _.isNumber(totalRows) && column.contiguous_rows_processed === totalRows;

    const inErrorMode = column.id === errorsColumnId;
    const linkPath = inErrorMode ?
      Links.showOutputSchema(path.uploadId, path.inputSchemaId, path.outputSchemaId) :
      Links.showErrorTableForColumn(path.uploadId, path.inputSchemaId, path.outputSchemaId, column.id);

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

    let errorFlyout = null;
    let flyoutId = null;
    if (column.num_transform_errors > 0 && !inErrorMode) {
      flyoutId = this.getFlyoutId();
      const msgTemplate = singularOrPlural(
        column.num_transform_errors,
        SubI18n.column_status_flyout.error_msg_singular,
        SubI18n.column_status_flyout.error_msg_plural
      );
      errorFlyout = (
        <div id={flyoutId} className="column-status-flyout flyout flyout-hidden">
          <section className="flyout-content">
            {msgTemplate.format({
              num_errors: column.num_transform_errors,
              type: SubI18n.type_display_names[column.soql_type]
            })}
            <TypeIcon type={this.props.column.soql_type} />
            <br />
            <span className="click-to-view">{SubI18n.column_status_flyout.click_to_view}</span>
          </section>
        </div>
      );
    }

    if (column.num_transform_errors > 0) {
      const msg = thisColumnDone ?
        singularOrPlural(
          column.num_transform_errors, SubI18n.error_exists, SubI18n.errors_exist
        ) :
        singularOrPlural(
          column.num_transform_errors, SubI18n.error_exists_scanning, SubI18n.errors_exist_scanning
        );
      return (
        <th key={column.id} className={classNames('col-errors', { 'col-errors-selected': inErrorMode })}>
          {progressBar}
          <div className="column-status-text">
            <span className="err-info error">{column.num_transform_errors}</span>
            <Link to={linkPath} data-flyout={flyoutId}>{msg}</Link>
          </div>
          {errorFlyout}
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
