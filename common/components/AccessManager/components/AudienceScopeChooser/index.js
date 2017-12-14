import React, { Component } from 'react';
import { Link } from 'react-router';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';

import styles from './chooser.scss';
import AudienceScopeChooserRadioButton from './AudienceScopeChooserRadioButton';

/**
 * Renders all the radio buttons to change the chosen audience,
 * and a button to go back to the AccessSummary.
 */
class AudienceScopeChooser extends Component {
  render() {
    return (
      <div>
        <form styleName="form">
          <AudienceScopeChooserRadioButton scope="private" />
          <br />
          <AudienceScopeChooserRadioButton scope="public" />
        </form>

        <div styleName="footer">
          <Link
            to="/"
            className="btn btn-primary"
            styleName="confirm-button">
            {I18n.t('shared.site_chrome.access_manager.accept')}
          </Link>
        </div>
      </div>
    );
  }
}

export default cssModules(AudienceScopeChooser, styles);
