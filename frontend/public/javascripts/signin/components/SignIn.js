import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import I18n from 'common/i18n';
import OptionsPropType from '../PropTypes/OptionsPropType';
import SignInForm from './SignInForm/SignInForm';
import SocialSignIn from './Social/SocialSignIn';
import styles from './signin.scss';

class SignIn extends React.Component {
  renderSocialSignIn(doAuth0Authorize) {
    // only render social sign-in if module is enabled
    if (this.props.options.showSocial) {
      return <SocialSignIn doAuth0Authorize={doAuth0Authorize} />;
    }
  }

  render() {
    const {
      doAuth0Authorize,
      doAuth0Login,
      auth0Connections,
      options,
      onLoginError,
      onLoginStart
    } = this.props;
    const { toggleViewMode } = options;
    return (
      <div styleName="inner-container">
        <div styleName="form-container">
          <SignInForm
            options={options}
            doAuth0Authorize={doAuth0Authorize}
            doAuth0Login={doAuth0Login}
            onLoginStart={onLoginStart}
            onLoginError={onLoginError}
            auth0Connections={auth0Connections} />
        </div>

        {this.renderSocialSignIn(doAuth0Authorize)}

        <div styleName="signup-container">
          {I18n.t('screens.sign_in.dont_have_account')}{' '}
          <a
            onClick={toggleViewMode}
            styleName="signup-link">
              {I18n.t('screens.sign_in.sign_up')}
          </a>
        </div>
      </div>
    );
  }
}

SignIn.propTypes = {
  options: OptionsPropType.isRequired,
  doAuth0Authorize: PropTypes.func.isRequired,
  doAuth0Login: PropTypes.func.isRequired,
  onLoginStart: PropTypes.func.isRequired,
  onLoginError: PropTypes.func.isRequired,
  auth0Connections: PropTypes.array.isRequired,
  setLoginFormVisibility: PropTypes.func.isRequired
};

export default cssModules(SignIn, styles);
