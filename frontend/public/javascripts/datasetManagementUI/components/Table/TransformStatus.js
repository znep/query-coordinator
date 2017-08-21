import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import { Link, withRouter } from 'react-router';
import * as DisplayState from '../../lib/displayState';
import { singularOrPlural } from '../../lib/util';
import styleguide from 'common/components';
import ProgressBar from '../ProgressBar';
import TypeIcon from '../TypeIcon';
import { commaify } from '../../../common/formatNumber';
import SocrataIcon from '../../../common/components/SocrataIcon';
import ErrorPill from 'components/ErrorPill';
import FailurePill from 'components/FailurePill';
import styles from 'styles/Table/TransformStatus.scss';

const SubI18n = I18n.show_output_schema.column_header;

function getErrorFlyoutId(transform) {
  return `transform-status-flyout-${transform.id}`;
}
function getGeoFlyoutId(transform) {
  return `transform-geo-flyout-${transform.id}`;
}

function ErrorFlyout({ transform }) {
  const flyoutId = getErrorFlyoutId(transform);
  const msgTemplate = singularOrPlural(
    transform.num_transform_errors,
    SubI18n.column_status_flyout.error_msg_singular,
    SubI18n.column_status_flyout.error_msg_plural
  );
  const canonicalTypeName = transform.output_soql_type;

  return (
    <div id={flyoutId} className={styles.transformStatusFlyout}>
      <section className={styles.flyoutContent}>
        {msgTemplate.format({
          num_errors: commaify(transform.num_transform_errors),
          type: SubI18n.type_display_names[canonicalTypeName]
        })}
        <TypeIcon type={canonicalTypeName} />
        <br />
        <span className={styles.clickToView}>{I18n.show_output_schema.click_to_view}</span>
      </section>
    </div>
  );
}

ErrorFlyout.propTypes = {
  transform: PropTypes.object.isRequired
};


function GeoFlyout({ transform }) {
  const flyoutId = getGeoFlyoutId(transform);
  return (
    <div id={flyoutId} className={styles.transformStatusFlyout}>
      <section className={styles.flyoutContent}>
        {SubI18n.can_geocode}
        <br />
        <span className={styles.clickToView}>{SubI18n.click_for_options}</span>
      </section>
    </div>
  );
}

GeoFlyout.propTypes = {
  transform: PropTypes.object.isRequired
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

  hasTransformErrors() {
    return this.props.transform.num_transform_errors > 0;
  }

  showGeocodeShortcut() {
    return _.includes(this.props.shortcuts, 'geocode');
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
    if (isIgnored) {
      return (
        <th className={styles.disabledColumn}>
          <div className={styles.columnProgressBar}>
            <ProgressBar
              type="done"
              percent={100}
              ariaLabeledBy={`column-display-name-${columnId}`} />
          </div>
          <div className={styles.statusText}>
            <SocrataIcon name="eye-blocked" className={styles.disabledIcon} />
            {SubI18n.ignored_column}
          </div>
        </th>
      );
    }


    const sourceDone = _.isNumber(totalRows);
    const thisColumnDone = _.isNumber(totalRows) &&
                           transform.contiguous_rows_processed === totalRows;

    const inErrorMode = DisplayState.inErrorMode(displayState, transform);

    const rowsProcessed = transform.contiguous_rows_processed || 0;
    const percentage = Math.round(rowsProcessed / totalRows * 100);
    const progressBarType = (!sourceDone || thisColumnDone) ? 'done' : 'inProgress';

    const progressBar = (
      <div className={styles.columnProgressBar}>
        <ProgressBar
          type={progressBarType}
          percent={percentage}
          ariaLabeledBy={`column-display-name-${columnId}`} />
      </div>
    );

    const geospatialShortcut = this.showGeocodeShortcut() ? (
      <Link
        className={styles.geoBadge}
        onClick={() => showShortcut('geocode')}
        data-flyout={getGeoFlyoutId(transform)}>
        <span className={styles.geoIcon}>
          Geo
        </span>
      </Link>
    ) : null;

    const errorFlyout = <ErrorFlyout transform={transform} />;
    const geoFlyout = <GeoFlyout transform={transform} />;

    if (transform.failed_at) {
      return (<th
        key={transform.id}
        className={styles.colFailed}>
        {progressBar}
        <div className={styles.colAttributes}>
          <a
            href="https://support.socrata.com/hc/en-us/requests/new?ticket_form_id=50543"
            target="_blank"
            className={styles.statusText}>
            <FailurePill />
            {SubI18n.transform_failed}
          </a>
        </div>
      </th>);
    }


    if (this.hasTransformErrors()) {
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
          ref={(flyoutParentEl) => { this.flyoutParentEl = flyoutParentEl; }}
          data-cheetah-hook="col-errors"
          className={classNames(styles.colErrors, { [styles.colErrorsSelected]: inErrorMode })}>
          {progressBar}
          <div className={styles.colAttributes}>
            {geospatialShortcut}
            {geoFlyout}
            <Link
              className={classNames(styles.statusText, { [styles.transformStatusSelected]: inErrorMode })}
              onClick={onClickError}
              data-flyout={getErrorFlyoutId(transform)}>
              <ErrorPill number={transform.num_transform_errors} />
              {msg}
            </Link>
          </div>
          {errorFlyout}
        </th>
      );
    } else {
      if (thisColumnDone) {
        return (
          <th
            key={transform.id}
            data-cheetah-hook="col-errors"
            className={styles.colErrors}
            ref={(flyoutParentEl) => { this.flyoutParentEl = flyoutParentEl; }}>
            {progressBar}
            <div className={styles.colAttributes}>
              {geospatialShortcut}
              {geoFlyout}
              <div className={styles.statusText}>
                <SocrataIcon name="checkmark3" className={styles.successIcon} />
                {SubI18n.no_errors_exist}
              </div>
            </div>
          </th>
        );
      } else {
        return (
          <th
            key={transform.id}
            data-cheetah-hook="col-errors"
            className={styles.colErrors}
            ref={(flyoutParentEl) => { this.flyoutParentEl = flyoutParentEl; }}>
            {progressBar}
            <div className={styles.colAttributes}>
              {geospatialShortcut}
              {geoFlyout}
              <div className={styles.statusText}>
                <span className={styles.spinner}></span>
                {SubI18n.scanning}
              </div>
            </div>
          </th>
        );
      }
    }
  }
}


TransformStatus.propTypes = {
  transform: PropTypes.object.isRequired,
  isIgnored: PropTypes.bool.isRequired,
  columnId: PropTypes.number.isRequired,
  displayState: DisplayState.propType.isRequired,
  path: PropTypes.object.isRequired,
  shortcuts: PropTypes.array.isRequired,
  totalRows: PropTypes.number,
  showShortcut: PropTypes.func.isRequired,
  onClickError: PropTypes.func.isRequired,
  flyouts: PropTypes.bool.isRequired
};

export default withRouter(TransformStatus);
