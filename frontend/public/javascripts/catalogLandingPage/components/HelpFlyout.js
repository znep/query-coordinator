import PropTypes from 'prop-types';
import React from 'react';
import Flyout from './Flyout';

export default class HelpFlyout extends React.Component {
  render() {
    const ZENDESK_LINK = 'https://support.socrata.com/hc/en-us/articles/115005683108';

    return (
      <div className="catalog-landing-page-help-flyout">
        <Flyout {...this.props}>
          <a href={ZENDESK_LINK} target="_blank">
            <span className="socrata-icon-question"></span>
          </a>
        </Flyout>
      </div>
    );
  }
}

HelpFlyout.propTypes = {
  left: PropTypes.bool,
  right: PropTypes.bool,
  text: PropTypes.string.isRequired
};

HelpFlyout.defaultProps = {
  left: false,
  right: false
};
