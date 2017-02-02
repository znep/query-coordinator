import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'socrata-components';
import _ from 'lodash';
import PollingInput from './PollingInput';
import styles from './sign-in-form.scss';

class PasswordInput extends React.Component {
  constructor(props) {
    super(props);
    this.renderDefault = this.renderDefault.bind(this);
  }

  renderSsoEnabled() {
    return (
      <div>
        <div styleName="icon-container">
          <SocrataIcon name="private" />
        </div>
        <div
          className="signin-password-sso-enabled-text"
          styleName="sso-enabled-text">
            {this.props.translate('screens.sign_in.sso_enabled')}
        </div>
      </div>
    );
  }

  renderDefault() {
    const { translate, onChange } = this.props;
    return (
      <div>
        <div styleName="icon-container">
          <SocrataIcon name="private" />
        </div>
        <PollingInput
          name="user_session[password]"
          aria-label={translate('screens.sign_in.form.password_placeholder')}
          styleName="input-password"
          type="password"
          placeholder={translate('screens.sign_in.form.password_placeholder')}
          onChange={onChange} />
      </div>
      );
  }

  render() {
    if (_.isEmpty(this.props.connectionName)) {
      return this.renderDefault();
    } else {
      return this.renderSsoEnabled();
    }
  }
}

PasswordInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  translate: PropTypes.func.isRequired,
  connectionName: PropTypes.string
};

export default cssModules(PasswordInput, styles);
