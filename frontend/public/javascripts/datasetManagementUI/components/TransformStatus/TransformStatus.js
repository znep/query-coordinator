import _ from 'lodash';

/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';

import React, { Component } from 'react';
import classNames from 'classnames';
import { Link, withRouter } from 'react-router';
import * as DisplayState from 'lib/displayState';
import { singularOrPlural } from 'lib/util';
import styleguide from 'common/components';
import ProgressBar from 'components/ProgressBar/ProgressBar';
import ErrorPill from 'components/ErrorPill/ErrorPill';
import ErrorFlyout, { getErrorFlyoutId } from 'components/ErrorFlyout/ErrorFlyout';
import GeoFlyout, { getGeoFlyoutId } from 'components/GeoFlyout/GeoFlyout';
import StatusText from 'components/StatusText/StatusText';
import styles from './TransformStatus.scss';

const SubI18n = I18n.show_output_schema.column_header;

const GeospatialShortcut = ({ showShortcut, flyoutId }) =>
  <Link className={styles.geoBadge} onClick={() => showShortcut('geocode')} data-flyout={flyoutId}>
    <span className={styles.geoIcon}>Geo</span>
  </Link>;

GeospatialShortcut.propTypes = {
  showShortcut: PropTypes.func.isRequired,
  flyoutId: PropTypes.string.isRequired
};

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

  hasTransformErrors() {
    return this.props.transform.error_count > 0;
  }

  showGeocodeShortcut() {
    return _.includes(this.props.shortcuts, 'geocode');
  }

  attachFlyouts() {
    // We only want to attach if there are flyouts on the page, otherwise we get a
    // ton of warnings about how flyouts weren't found - so we need to limit
    // the attach code to run only when we might be showing an element
    // that shows a flyout; which at the time of writing this comment
    // are the transform error and geocode shortcut icons
    const hasFlyouts = this.hasTransformErrors() || this.showGeocodeShortcut();

    if (this.props.flyouts && this.flyoutParentEl && hasFlyouts) {
      styleguide.attachTo(this.flyoutParentEl);
    }
  }

  determineColStatus(isIgnored, transform, totalRows) {
    // TODO delete this when dsmapi pr goes in
    const oldDoneCheck = transform.contiguous_rows_processed === totalRows;
    if (transform.failed_at) {
      return 'failed';
    } else if (isIgnored) {
      return 'isIgnored';
    } else if (transform.completed_at || oldDoneCheck) {
      return 'done';
    } else {
      return 'inProgress';
    }
  }

  render() {
    const {
      transform,
      totalRows,
      displayState,
      columnId,
      isIgnored,
      showShortcut,
      onClickError
    } = this.props;

    const inErrorMode = displayState.type === DisplayState.inErrorMode(displayState, transform);

    const rowsProcessed = transform.contiguous_rows_processed || 0;

    const percentage = Math.round(rowsProcessed / totalRows * 100);

    const colStatus = this.determineColStatus(isIgnored, transform, totalRows);

    const hasErrors = this.hasTransformErrors();

    const progressbarType = colStatus === 'inProgress' ? colStatus : 'done';

    const errorStatusMessage =
      colStatus === 'done'
        ? singularOrPlural(transform.error_count, SubI18n.error_exists, SubI18n.errors_exist)
        : singularOrPlural(
            transform.error_count,
            SubI18n.error_exists_scanning,
            SubI18n.errors_exist_scanning
          );

    let thClasses;
    let progressbarPercent;
    let statusTextMessage;
    let extraProps = {};

    switch (colStatus) {
      case 'failed':
        thClasses = styles.failedColumn;
        progressbarPercent = 0;
        statusTextMessage = SubI18n.transform_failed;
        break;
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
        <div className={styles.colAttributes}>
          {this.showGeocodeShortcut() &&
            <GeospatialShortcut flyoutId={getGeoFlyoutId(transform)} showShortcut={showShortcut} />}
          <GeoFlyout transform={transform} />
          {hasErrors
            ? <Link
              className={classNames(styles.statusText, { [styles.transformStatusSelected]: inErrorMode })}
              onClick={onClickError}
              data-flyout={getErrorFlyoutId(transform)}>
                <ErrorPill number={transform.error_count} />
                {errorStatusMessage}
              </Link>
            : <StatusText message={statusTextMessage} status={colStatus} />}
          {hasErrors && <ErrorFlyout transform={transform} />}
        </div>
      </th>
    );
  }
}

TransformStatus.propTypes = {
  transform: PropTypes.object.isRequired,
  isIgnored: PropTypes.bool.isRequired,
  columnId: PropTypes.number.isRequired,
  displayState: DisplayState.propType.isRequired,
  totalRows: PropTypes.number,
  shortcuts: PropTypes.array.isRequired,
  flyouts: PropTypes.bool.isRequired,
  showShortcut: PropTypes.func.isRequired,
  onClickError: PropTypes.func.isRequired
};

export default withRouter(TransformStatus);
