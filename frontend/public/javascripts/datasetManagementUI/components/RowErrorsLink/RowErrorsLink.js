import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';
import { commaify } from '../../../common/formatNumber';
import { Link, withRouter } from 'react-router';
import * as Links from 'links/links';
import * as DisplayState from 'lib/displayState';
import { singularOrPlural } from 'lib/util';
import styleguide from 'common/components';
import styles from './RowErrorsLink.module.scss';

const FLYOUT_ID = 'malformed-rows-flyout';

function ErrorFlyout({ numRowErrors }) {
  const SubI18n = I18n.show_output_schema.row_errors;
  const message = singularOrPlural(
    numRowErrors,
    SubI18n.flyout_message_singular,
    SubI18n.flyout_message_plural.format(commaify(numRowErrors))
  );
  return (
    <div id={FLYOUT_ID} className="malformed-rows-flyout flyout flyout-hidden">
      <section className="flyout-content">
        {message} {SubI18n.flyout_message_explanation}
        <br />
        <span className={styles.clickToView}>{I18n.show_output_schema.click_to_view}</span>
      </section>
    </div>
  );
}

ErrorFlyout.propTypes = {
  numRowErrors: PropTypes.number.isRequired
};

class RowErrorsLink extends Component {
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
    styleguide.attachTo(this.flyoutParentEl);
  }

  render() {
    const { params, displayState, numRowErrors, inRowErrorMode } = this.props;
    const inRowErrorState = displayState.type === DisplayState.ROW_ERRORS;
    const linkPath = inRowErrorState
      ? Links.showOutputSchema(params, params.sourceId, params.inputSchemaId, params.outputSchemaId)
      : Links.showRowErrors(params, params.sourceId, params.inputSchemaId, params.outputSchemaId);
    const SubI18n = I18n.show_output_schema.row_errors;

    return (
      <tr className={styles.rowErrorsCount}>
        <th
          className={classNames(styles.rowErrorsCount, { [styles.rowErrorsCountSelected]: inRowErrorMode })}>
          <div
            ref={flyoutParentEl => {
              this.flyoutParentEl = flyoutParentEl;
            }}>
            <Link to={linkPath}>
              <div className={styles.malformedRowsStatusText} data-flyout={FLYOUT_ID}>
                <span className={styles.error}>{commaify(numRowErrors)}</span>
                {singularOrPlural(numRowErrors, SubI18n.malformed_row, SubI18n.malformed_rows)}
              </div>
              <ErrorFlyout numRowErrors={numRowErrors} />
            </Link>
          </div>
        </th>
      </tr>
    );
  }
}

RowErrorsLink.propTypes = {
  params: PropTypes.object.isRequired,
  displayState: DisplayState.propType.isRequired,
  numRowErrors: PropTypes.number.isRequired,
  inRowErrorMode: PropTypes.bool.isRequired
};

export default withRouter(RowErrorsLink);
