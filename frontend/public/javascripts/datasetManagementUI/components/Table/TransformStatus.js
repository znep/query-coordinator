/* eslint react/jsx-indent: 0 */
import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import { Link, withRouter } from 'react-router';
import * as Links from 'links';
import * as DisplayState from 'lib/displayState';
import { singularOrPlural } from 'lib/util';
import styleguide from 'common/components';
import ProgressBar from 'components/ProgressBar';
import ErrorPill from 'components/ErrorPill';
import ErrorFlyout, { getFlyoutId } from 'components/Table/ErrorFlyout';
import StatusText from 'components/Table/StatusText';
import styles from 'styles/Table/TransformStatus.scss';

const SubI18n = I18n.show_output_schema.column_header;

export class TransformStatus extends Component {
  componentDidMount() {
    this.attachFlyouts();
  }

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps, this.props);
  }

  componentDidUpdate() {
    this.attachFlyouts();
  }

  attachFlyouts() {
    if (this.flyoutParentEl) {
      styleguide.attachTo(this.flyoutParentEl);
    }
  }

  determineColStatus(isIgnored, transform, totalRows) {
    if (!transform.contiguous_rows_processed || !totalRows) {
      return 'inProgress';
    } else if (isIgnored) {
      return isIgnored;
    } else if (transform.contiguous_rows_processed === totalRows) {
      return 'done';
    } else {
      return 'inProgress';
    }
  }

  render() {
    const { transform, totalRows, path, displayState, columnId, isIgnored, params } = this.props;

    const inErrorMode =
      displayState.type === DisplayState.COLUMN_ERRORS && transform.id === displayState.transformId;

    const linkPath = inErrorMode
      ? Links.showOutputSchema(params, path.sourceId, path.inputSchemaId, path.outputSchemaId)
      : Links.showColumnErrors(params, path.sourceId, path.inputSchemaId, path.outputSchemaId, transform.id);

    const rowsProcessed = transform.contiguous_rows_processed || 0;

    const percentage = Math.round(rowsProcessed / totalRows * 100);

    const colStatus = this.determineColStatus(isIgnored, transform, totalRows);

    const hasErrors = transform.num_transform_errors > 0;

    const progressbarType = colStatus === 'inProgress' ? colStatus : 'done';

    const errorStatusMessage =
      colStatus === 'done'
        ? singularOrPlural(transform.num_transform_errors, SubI18n.error_exists, SubI18n.errors_exist)
        : singularOrPlural(
            transform.num_transform_errors,
            SubI18n.error_exists_scanning,
            SubI18n.errors_exist_scanning
          );

    let thClasses;
    let progressbarPercent;
    let statusTextMessage;
    let extraProps = {};

    switch (colStatus) {
      case 'isIgnored':
        thClasses = styles.disabledColumn;
        progressbarPercent = 100;
        statusTextMessage = SubI18n.ignored_column;
        break;
      case 'done':
        thClasses = styles.colErrors;
        progressbarPercent = percentage;
        statusTextMessage = SubI18n.no_errors_exist;
        break;
      default:
        thClasses = styles.colErrors;
        progressbarPercent = percentage;
        statusTextMessage = SubI18n.scanning;
    }

    if (hasErrors) {
      extraProps = {
        ref: flyoutParentEl => (this.flyoutParentEl = flyoutParentEl),
        'data-flyout': getFlyoutId(transform),
        className: classNames(styles.colErrors, { [styles.colErrorsSelected]: inErrorMode })
      };
    }

    return (
      <th className={thClasses} key={transform.id} data-cheetah-hook="col-errors" {...extraProps}>
        <div className={styles.columnProgressBar}>
          <ProgressBar
            type={progressbarType}
            percent={progressbarPercent}
            ariaLabeledBy={`column-display-name-${columnId}`} />
        </div>
        {hasErrors
          ? <Link
            className={classNames(styles.statusText, { [styles.transformStatusSelected]: inErrorMode })}
            to={linkPath}
            data-flyout={getFlyoutId(transform)}>
              <ErrorPill number={transform.num_transform_errors} />
              {errorStatusMessage}
            </Link>
          : <StatusText message={statusTextMessage} status={colStatus} />}
        {hasErrors && <ErrorFlyout transform={transform} />}
      </th>
    );
  }
}

TransformStatus.propTypes = {
  transform: PropTypes.object.isRequired,
  isIgnored: PropTypes.bool.isRequired,
  columnId: PropTypes.number.isRequired,
  displayState: DisplayState.propType.isRequired,
  path: PropTypes.object.isRequired,
  totalRows: PropTypes.number,
  params: PropTypes.object.isRequired
};

export default withRouter(TransformStatus);
