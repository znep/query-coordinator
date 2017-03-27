import React, { PropTypes, Component } from 'react';
import { commaify } from '../../../common/formatNumber';
import { Link } from 'react-router';
import * as Links from '../../links';
import * as DisplayState from '../../lib/displayState';
import { singularOrPlural } from '../../lib/util';
import styleguide from 'socrata-components';

const FLYOUT_ID = 'malformed-rows-flyout';

function ErrorFlyout({ numRowErrors }) {
  const SubI18n = I18n.show_output_schema.row_errors;
  const message = singularOrPlural(
    numRowErrors,
    SubI18n.flyout_message_singular,
    SubI18n.flyout_message_plural.format({ numRowErrors: commaify(numRowErrors) })
  );
  return (
    <div
      id={FLYOUT_ID}
      className="malformed-rows-flyout flyout flyout-hidden">
      <section className="flyout-content">
        {message} {SubI18n.flyout_message_explanation}
        <br />
        <span className="click-to-view">{I18n.show_output_schema.click_to_view}</span>
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
    const { path, displayState, numRowErrors } = this.props;
    const inRowErrorState = displayState.type === DisplayState.ROW_ERRORS;
    const linkPath = inRowErrorState ?
      Links.showOutputSchema(path.uploadId, path.inputSchemaId, path.outputSchemaId) :
      Links.showRowErrors(path.uploadId, path.inputSchemaId, path.outputSchemaId);
    const SubI18n = I18n.show_output_schema.row_errors;

    return (
      <div ref={(flyoutParentEl) => { this.flyoutParentEl = flyoutParentEl; }}>
        <Link to={linkPath}>
          <div className="malformed-rows-status-text" data-flyout={FLYOUT_ID}>
            <span className="err-info error">{commaify(numRowErrors)}</span>
            {singularOrPlural(numRowErrors, SubI18n.malformed_row, SubI18n.malformed_rows)}
          </div>
          <ErrorFlyout numRowErrors={numRowErrors} />
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

export default RowErrorsLink;
