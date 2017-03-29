import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router';
import * as Links from '../../links';
import { singularOrPlural } from '../../lib/util';
import styleguide from 'socrata-components';
import ProgressBar from '../ProgressBar';
import TypeIcon from '../TypeIcon';
import { commaify } from '../../../common/formatNumber';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/Table/TransformStatus.scss';

class TransformStatus extends Component {
  componentDidMount() {
    this.attachFlyouts();
  }

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps, this.props);
  }

  componentDidUpdate() {
    this.attachFlyouts();
  }

  getFlyoutId() {
    return `transform-status-flyout-${this.props.transform.id}`;
  }

  attachFlyouts() {
    const element = document.getElementById(this.getFlyoutId());
    if (element) {
      styleguide.attachTo(element.parentNode);
    }
  }

  render() {
    const { transform, totalRows, path, errorsTransformId, columnId } = this.props;
    const SubI18n = I18n.show_output_schema.column_header;
    const uploadDone = _.isNumber(totalRows);
    const thisColumnDone = _.isNumber(totalRows) &&
      transform.contiguous_rows_processed === totalRows;

    const inErrorMode = transform.id === errorsTransformId;
    const linkPath = inErrorMode ?
      Links.showOutputSchema(path.uploadId, path.inputSchemaId, path.outputSchemaId) :
      Links.showErrorTableForColumn(path.uploadId, path.inputSchemaId, path.outputSchemaId, transform.id);

    const rowsProcessed = transform.contiguous_rows_processed || 0;
    const percentage = Math.round(rowsProcessed / totalRows * 100);
    const progressBarType = (!uploadDone || thisColumnDone) ? 'done' : 'inProgress';

    const progressBar = (
      <div className={styles.columnProgressBar}>
        <ProgressBar
          type={progressBarType}
          percent={percentage}
          ariaLabeledBy={`column-display-name-${columnId}`} />
      </div>
    );

    let errorFlyout = null;
    let flyoutId = null;
    if (transform.num_transform_errors > 0 && !inErrorMode) {
      flyoutId = this.getFlyoutId();
      const msgTemplate = singularOrPlural(
        transform.num_transform_errors,
        SubI18n.column_status_flyout.error_msg_singular,
        SubI18n.column_status_flyout.error_msg_plural
      );
      errorFlyout = (
        <div id={flyoutId} className={styles.transformStatusFlyout}>
          <section className={styles.flyoutContent}>
            {msgTemplate.format({
              num_errors: commaify(transform.num_transform_errors),
              type: SubI18n.type_display_names[transform.output_soql_type]
            })}
            <TypeIcon type={transform.output_soql_type} />
            <br />
            <span className={styles.clickToView}>{SubI18n.column_status_flyout.click_to_view}</span>
          </section>
        </div>
      );
    }

    if (transform.num_transform_errors > 0) {
      const msg = thisColumnDone ?
        singularOrPlural(
          transform.num_transform_errors, SubI18n.error_exists, SubI18n.errors_exist
        ) :
        singularOrPlural(
          transform.num_transform_errors, SubI18n.error_exists_scanning, SubI18n.errors_exist_scanning
        );
      return (
        <th
          key={transform.id}
          data-cheetah-hook="col-errors"
          className={classNames(styles.colErrors, { [styles.colErrorsSelected]: inErrorMode })}>
          {progressBar}
          <div className={styles.statusText}>
            <span className={styles.error}>{commaify(transform.num_transform_errors)}</span>
            <Link to={linkPath} data-flyout={flyoutId}>{msg}</Link>
          </div>
          {errorFlyout}
        </th>
      );
    } else {
      if (thisColumnDone) {
        return (
          <th key={transform.id} data-cheetah-hook="col-errors" className={styles.colErrors}>
            {progressBar}
            <div className={styles.statusText}>
              <SocrataIcon name="checkmark3" className={styles.successIcon} />
              {SubI18n.no_errors_exist}
            </div>
          </th>
        );
      } else {
        return (
          <th key={transform.id} data-cheetah-hook="col-errors" className={styles.colErrors}>
            {progressBar}
            <div className={styles.statusText}>
              <span className={styles.spinner}></span>
              {SubI18n.scanning}
            </div>
          </th>
        );
      }
    }
  }
}

TransformStatus.propTypes = {
  transform: PropTypes.object.isRequired,
  columnId: PropTypes.number.isRequired,
  errorsTransformId: PropTypes.number,
  path: PropTypes.object.isRequired,
  totalRows: PropTypes.number
};

export default TransformStatus;
