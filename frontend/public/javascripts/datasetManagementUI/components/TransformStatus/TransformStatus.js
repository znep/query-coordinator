/* eslint react/jsx-indent: 0 */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router';
import * as DisplayState from 'datasetManagementUI/lib/displayState';
import { singularOrPlural } from 'datasetManagementUI/lib/util';
import styleguide from 'common/components';
import ProgressBar from 'datasetManagementUI/components/ProgressBar/ProgressBar';
import ErrorPill from 'datasetManagementUI/components/ErrorPill/ErrorPill';
import ErrorFlyout, { getErrorFlyoutId } from 'datasetManagementUI/components/ErrorFlyout/ErrorFlyout';
import GeoFlyout, { getGeoFlyoutId } from 'datasetManagementUI/components/GeoFlyout/GeoFlyout';
import MapFlyout from 'datasetManagementUI/containers/MapFlyoutContainer';
import StatusText from 'datasetManagementUI/components/StatusText/StatusText';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './TransformStatus.module.scss';

const SubI18n = I18n.show_output_schema.column_header;

const GEOSPATIAL_TYPES = [
  'location',
  'multiline',
  'multipoint',
  'multipolygon',
  'point',
  'line',
  'polygon'
];

const GeospatialShortcut = ({ flyoutId }) => (
  <Link className={styles.geoBadge} onClick={() => console.warn('not implemented!')} data-flyout={flyoutId}>
     <SocrataIcon name="geo" />
  </Link>
);
GeospatialShortcut.propTypes = {
  flyoutId: PropTypes.string.isRequired
};


const MapFlyoutShortcut = ({ toggleMap }) => (
  <Link className={styles.mapBadge} onClick={toggleMap}>
    <SocrataIcon name="region" />
  </Link>
);
MapFlyoutShortcut.propTypes = {
  toggleMap: PropTypes.func.isRequired
};

export class TransformStatus extends Component {
  constructor() {
    super();
    this.state = {
      isMapShowing: false,
      mapPosition: null
    };

    this.toggleMap = this.toggleMap.bind(this);
  }
  componentDidMount() {
    this.attachFlyouts();
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(this.state, nextState);
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

  showMapFlyout() {
    return _.includes(GEOSPATIAL_TYPES, this.props.transform.output_soql_type);
  }

  toggleMap(e) {
    const sidebarWidth = 258;
    const mapWidth = 500;
    const left = e.target.getBoundingClientRect().left;

    var posn = -250;
    posn = Math.max(posn, sidebarWidth - left);
    posn = Math.min(posn, window.innerWidth - mapWidth);

    this.setState({
      isMapShowing: !this.state.isMapShowing,
      mapPosition: posn
    });
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

  determineColStatus(transform) {
    if (transform.failed_at) {
      return 'failed';
    } else if (transform.finished_at || transform.completed_at) {
      return 'done';
    } else {
      return 'inProgress';
    }
  }

  render() {
    const {
      outputSchema,
      transform,
      params,
      totalRows,
      displayState,
      columnId,
      onClickError,
      isDropping
    } = this.props;

    const inErrorMode = displayState.type === DisplayState.inErrorMode(displayState, transform);

    const rowsProcessed = transform.contiguous_rows_processed || 0;

    const percentage = Math.round(rowsProcessed / totalRows * 100);

    const colStatus = this.determineColStatus(transform);

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
    let extraProps = {
      ref: flyoutParentEl => (this.flyoutParentEl = flyoutParentEl)
    };

    switch (colStatus) {
      case 'failed':
        thClasses = styles.failedColumn;
        progressbarPercent = 0;
        statusTextMessage = SubI18n.transform_failed;
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
        ...extraProps,
        className: classNames(styles.colErrors, { [styles.colErrorsSelected]: inErrorMode })
      };
    }

    if (isDropping) {
      thClasses = [thClasses, styles.dropping].join(' ');
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
          {this.showGeocodeShortcut() && (
            <GeospatialShortcut flyoutId={getGeoFlyoutId(transform)} />
          )}
          {this.showMapFlyout() && (
            <MapFlyoutShortcut
              toggleMap={this.toggleMap}
              displayState={displayState} />
          )}
          <GeoFlyout transform={transform} />

          {this.state.isMapShowing && <MapFlyout
            outputSchema={outputSchema}
            transform={transform}
            params={params}
            displayState={this.props.displayState}
            left={this.state.mapPosition}
            onClose={this.toggleMap} />}
          {hasErrors ? (
            <Link
              className={classNames(styles.statusText, { [styles.transformStatusSelected]: inErrorMode })}
              onClick={onClickError}
              data-flyout={getErrorFlyoutId(transform)}>
              <ErrorPill number={transform.error_count} />
              {errorStatusMessage}
            </Link>
          ) : (
            <StatusText message={statusTextMessage} status={colStatus} />
          )}
          {hasErrors && <ErrorFlyout transform={transform} />}
        </div>
      </th>
    );
  }
}

TransformStatus.propTypes = {
  outputSchema: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  isDropping: PropTypes.bool,
  transform: PropTypes.object.isRequired,
  columnId: PropTypes.number.isRequired,
  displayState: DisplayState.propType.isRequired,
  totalRows: PropTypes.number,
  shortcuts: PropTypes.array.isRequired,
  flyouts: PropTypes.bool.isRequired,
  onClickError: PropTypes.func.isRequired
};

export default TransformStatus;
