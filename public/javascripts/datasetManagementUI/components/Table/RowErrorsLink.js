import React, { PropTypes, Component } from 'react';
import { commaify } from '../../../common/formatNumber';
import { Link } from 'react-router';
import * as Links from '../../links';
import * as DisplayState from './displayState';
import { singularOrPlural } from '../../lib/util';
import styleguide from 'socrata-components';

const FLYOUT_ID = 'malformed-rows-flyout';

export default class RowErrorsLink extends Component {

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
    const element = document.getElementById(FLYOUT_ID);
    if (element) {
      styleguide.attachTo(element.parentNode);
    }
  }

  render() {
    const { path, displayState, numRowErrors } = this.props;
    const inRowErrorState = displayState.type === DisplayState.ROW_ERRORS;
    const linkPath = inRowErrorState ?
      Links.showOutputSchema(path.uploadId, path.inputSchemaId, path.outputSchemaId) :
      Links.showRowErrors(path.uploadId, path.inputSchemaId, path.outputSchemaId);

    const SubI18n = I18n.show_output_schema.row_errors;
    const msgTemplate = singularOrPlural(
      numRowErrors,
      SubI18n.flyout_message_singular,
      SubI18n.flyout_message_plural
    );
    const errorFlyout = (
      <div id={FLYOUT_ID} className="malformed-rows-flyout flyout flyout-hidden">
        <section className="flyout-content">
          {msgTemplate.format({
            numRowErrors: commaify(numRowErrors)
          })}&nbsp;
          {SubI18n.flyout_message_explanation}
          <br />
          <span className="click-to-view">{I18n.show_output_schema.click_to_view}</span>
        </section>
      </div>
    );

    return (
      <div>
        <Link to={linkPath}>
          <div className="malformed-rows-status-text" data-flyout={FLYOUT_ID}>
            <span className="err-info error">{commaify(numRowErrors)}</span>
            {singularOrPlural(numRowErrors, SubI18n.malformed_row, SubI18n.malformed_rows)}
          </div>
          {errorFlyout}
        </Link>
      </div>
    );
  }

}

RowErrorsLink.propTypes = {
  path: PropTypes.object.isRequired,
  displayState: PropTypes.object.isRequired,
  numRowErrors: PropTypes.number.isRequired
};
