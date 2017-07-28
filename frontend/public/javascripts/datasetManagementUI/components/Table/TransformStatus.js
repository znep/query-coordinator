import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import { Link, withRouter } from 'react-router';
import * as Links from '../../links';
import * as DisplayState from '../../lib/displayState';
import { singularOrPlural } from '../../lib/util';
import styleguide from 'common/components';
import ProgressBar from '../ProgressBar';
import TypeIcon from '../TypeIcon';
import { commaify } from '../../../common/formatNumber';
import SocrataIcon from '../../../common/components/SocrataIcon';
import ErrorPill from 'components/ErrorPill';
import styles from 'styles/Table/TransformStatus.scss';

function getFlyoutId(transform) {
  return `transform-status-flyout-${transform.id}`;
}

function ErrorFlyout({ transform }) {
  const SubI18n = I18n.show_output_schema.column_header;
  const flyoutId = getFlyoutId(transform);
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
        <span className={styles.clickToView}>
          {I18n.show_output_schema.click_to_view}
        </span>
      </section>
    </div>
  );
}

ErrorFlyout.propTypes = {
  transform: PropTypes.object.isRequired
};

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

  attachFlyouts() {
    if (this.flyoutParentEl) {
      styleguide.attachTo(this.flyoutParentEl);
    }
  }

  render() {
    const { transform, totalRows, path, displayState, columnId, isIgnored, params } = this.props;
    const SubI18n = I18n.show_output_schema.column_header;
    if (isIgnored) {
      return (
        <th className={styles.disabledColumn}>
          <div className={styles.columnProgressBar}>
            <ProgressBar type="done" percent={100} ariaLabeledBy={`column-display-name-${columnId}`} />
          </div>
          <div className={styles.statusText}>
            <SocrataIcon name="eye-blocked" className={styles.disabledIcon} />
            {SubI18n.ignored_column}
          </div>
        </th>
      );
    }

    const sourceDone = _.isNumber(totalRows);
    const thisColumnDone = _.isNumber(totalRows) && transform.contiguous_rows_processed === totalRows;

    const inErrorMode =
      displayState.type === DisplayState.COLUMN_ERRORS && transform.id === displayState.transformId;

    const linkPath = inErrorMode
      ? Links.showOutputSchema(params, path.sourceId, path.inputSchemaId, path.outputSchemaId)
      : Links.showColumnErrors(params, path.sourceId, path.inputSchemaId, path.outputSchemaId, transform.id);

    const rowsProcessed = transform.contiguous_rows_processed || 0;
    const percentage = Math.round(rowsProcessed / totalRows * 100);
    const progressBarType = !sourceDone || thisColumnDone ? 'done' : 'inProgress';

    const progressBar = (
      <div className={styles.columnProgressBar}>
        <ProgressBar
          type={progressBarType}
          percent={percentage}
          ariaLabeledBy={`column-display-name-${columnId}`} />
      </div>
    );

    const errorFlyout = <ErrorFlyout transform={transform} />;

    if (transform.num_transform_errors > 0) {
      const msg = thisColumnDone
        ? singularOrPlural(transform.num_transform_errors, SubI18n.error_exists, SubI18n.errors_exist)
        : singularOrPlural(
            transform.num_transform_errors,
            SubI18n.error_exists_scanning,
            SubI18n.errors_exist_scanning
          );
      return (
        <th
          key={transform.id}
          ref={flyoutParentEl => {
            this.flyoutParentEl = flyoutParentEl;
          }}
          data-flyout={getFlyoutId(transform)}
          data-cheetah-hook="col-errors"
          className={classNames(styles.colErrors, { [styles.colErrorsSelected]: inErrorMode })}>
          {progressBar}
          <Link
            className={classNames(styles.statusText, { [styles.transformStatusSelected]: inErrorMode })}
            to={linkPath}
            data-flyout={getFlyoutId(transform)}>
            <ErrorPill number={transform.num_transform_errors} />
            {msg}
          </Link>
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
              <span className={styles.spinner} />
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
  isIgnored: PropTypes.bool.isRequired,
  columnId: PropTypes.number.isRequired,
  displayState: DisplayState.propType.isRequired,
  path: PropTypes.object.isRequired,
  totalRows: PropTypes.number,
  params: PropTypes.object.isRequired
};

export default withRouter(TransformStatus);
