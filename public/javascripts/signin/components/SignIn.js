import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import OptionsPropType from '../PropTypes/OptionsPropType';
import SignInForm from './SignInForm/SignInForm';
import SocialSignIn from './Social/SocialSignIn';
import styles from './signin.scss';

class SignIn extends React.Component {
  renderSocialSignIn(doAuth0Login, translate) {
    // only render social sign-in if module is enabled
    if (this.props.options.showSocial) {
      return <SocialSignIn doAuth0Login={doAuth0Login} translate={translate} />;
    }
  }

  render() {
    const { doAuth0Login, auth0Connections, translate, options } = this.props;
    return (
      <div styleName="inner-container">
        <div styleName="form-container">
          <SignInForm
            options={options}
            translate={translate}
            doAuth0Login={doAuth0Login}
            auth0Connections={auth0Connections} />
        </div>

        {this.renderSocialSignIn(doAuth0Login, translate)}

        <div styleName="signup-container">
          {translate('screens.sign_in.dont_have_account')}
          <a
            href="/signup"
            styleName="signup-link">
              {translate('screens.sign_in.sign_up')}
          </a>
        </div>
      </div>
    );
  }
}

SignIn.propTypes = {
  options: OptionsPropType.isRequired,
  translate: PropTypes.func.isRequired,
  doAuth0Login: PropTypes.func.isRequired,
  auth0Connections: PropTypes.array.isRequired,
  setLoginFormVisibility: PropTypes.func.isRequired
};

export default cssModules(SignIn, styles);
