import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'common/components';
import _ from 'lodash';
import I18n from 'common/i18n';
import styles from './sign-in-form.scss';

class PasswordInput extends React.Component {
  renderSsoEnabled(isUsingSingleSignOn) {
    return (
      <div
        className="signin-sso-enabled-container"
        style={{ visibility: !isUsingSingleSignOn ? 'hidden' : 'visible' }}
        styleName="sso-enabled-container">
        <div styleName="icon-container">
          <SocrataIcon name="private" />
        </div>
        <div
          className="signin-password-sso-enabled-text"
          styleName="sso-enabled-text">
            {I18n.t('screens.sign_in.sso_enabled')}
        </div>
      </div>
    );
  }

  renderInput(isUsingSingleSignOn) {
    const { onChange } = this.props;
    return (
      <div
        className="signin-password-input-container"
        style={{ visibility: isUsingSingleSignOn ? 'hidden' : 'visible' }}>
        <div styleName="icon-container">
          <SocrataIcon name="private" />
        </div>
        <input
          name="user_session[password]"
          aria-label={I18n.t('screens.sign_in.form.password_placeholder')}
          styleName="input-password"
          type="password"
          placeholder={I18n.t('screens.sign_in.form.password_placeholder')}
          onChange={onChange} />
      </div>
      );
  }

  render() {
    const isUsingSingleSignOn = !_.isEmpty(this.props.connectionName);

    // Note that both the input and the "SSO enabled" text are rendered
    // but their visibility is toggled by whether or not we have been
    // passed a connection name via props.
    //
    // Originally, this component conditionally rendered one or another
    // but some browser plugins (i.e. lastpass) would detect the form "changing"
    // and "helpfully" fill it back in, making it impossible to clear out the inputs
    return (
      <div>
        {this.renderInput(isUsingSingleSignOn)}
        {this.renderSsoEnabled(isUsingSingleSignOn)}
      </div>
    );
  }
}

PasswordInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  connectionName: PropTypes.string
};

export default cssModules(PasswordInput, styles);
