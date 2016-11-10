import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import styles from './sign-in-form.scss';
import passwordIcon from 'icons/private.svg';

class PasswordInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.renderDefault = this.renderDefault.bind(this);
  }

  handleChange(event) {
    this.props.onChange(event.target.value);
  }

  renderSsoEnabled() {
    return (
      <div>
        <div styleName="icon-container" dangerouslySetInnerHTML={{ __html: passwordIcon }} />
        <div styleName="sso-enabled-text">{$.t('screens.sign_in.sso_enabled')}</div>
      </div>
    );
  }

  renderDefault() {
    return (
      <div>
        <div styleName="icon-container" dangerouslySetInnerHTML={{ __html: passwordIcon }} />
        <input
          name="user_session[password]"
          aria-label={$.t('screens.sign_in.form.password_placeholder')}
          styleName="input-password"
          type="password"
          placeholder={$.t('screens.sign_in.form.password_placeholder')}
          onChange={this.handleChange} />
      </div>
      );
  }

  render() {
    if (_.isEmpty(this.props.connection)) {
      return this.renderDefault();
    } else {
      return this.renderSsoEnabled();
    }
  }
}

PasswordInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  connection: PropTypes.object
};

export default cssModules(PasswordInput, styles);