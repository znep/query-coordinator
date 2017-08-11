import React from 'react';
import cssModules from 'react-css-modules';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import auth0 from 'auth0-js';
import url from 'url';
import { renderAlerts } from '../Util';
import signUpReducer from '../reducers/SignUpReducer';
import OptionsPropType from '../PropTypes/OptionsPropType';
import styles from './signup.scss';
import SignUpForm from './SignUpForm/SignUpForm';
import SocialSignIn from './Social/SocialSignIn';

class SignUp extends React.Component {
  constructor(props) {
    super(props);

    const { auth0Uri, auth0ClientId, baseDomainUri, params } = this.props.options;

    const parsedUrl = url.parse(window.location.href, true);
    const urlAuthToken = _.get(parsedUrl, 'query.auth_token', '');

    // if an email comes in from the query string, we want to use that,
    // otherwise grab it from params, otherwise empty
    const email = _.get(parsedUrl, 'query.email', _.get(params, 'email', ''));
    const screenName = _.get(params, 'screenName', '');

    this.state = {
      auth0Client: new auth0.WebAuth({
        domain: auth0Uri,
        clientID: auth0ClientId,
        responseType: 'token',
        redirectUri: `${baseDomainUri}/auth/auth0/callback`
      })
    };

    const defaultState = {
      formSubmitted: false,
      urlAuthToken,
      inputs: {
        email: {
          value: email,
          valid: true,
          message: '',
          required: true
        },
        screenName: {
          value: screenName,
          valid: true,
          message: '',
          required: true
        },
        password: {
          value: '',
          valid: true,
          message: '',
          required: true
        },
        passwordConfirm: {
          value: '',
          valid: true,
          message: '',
          required: true
        },
        recaptcha: {
          // since the recaptcha doesn't have a real "value" (it's just valid or invalid)
          // we mark it as required false, which skips checking if the value is empty or not
          valid: false,
          required: false
        }
      }
    };

    this.store = createStore(
      signUpReducer(props.translate),
      defaultState
    );

    this.renderSocialSignIn = this.renderSocialSignIn.bind(this);
    this.renderDisclaimer = this.renderDisclaimer.bind(this);
  }

  renderSocialSignIn() {
    // only render social sign-in if module is enabled
    if (this.props.options.showSocial) {
      const { auth0Client } = this.state;
      const { translate } = this.props;
      const doAuth0Authorize = auth0Client.authorize.bind(auth0Client);
      return <SocialSignIn doAuth0Authorize={doAuth0Authorize} translate={translate} />;
    }
  }

  renderDisclaimer() {
    const { signUpDisclaimer } = this.props.options;

    if (_.isEmpty(signUpDisclaimer)) {
      return null;
    }

    return (<div styleName="disclaimer">{signUpDisclaimer}</div>);
  }

  render() {
    const { options, translate } = this.props;

    const flashes = _.get(this.props, 'options.flashes', null);

    return (
      <Provider store={this.store}>
        <div styleName="container">
          {renderAlerts(flashes)}

          <h3>{translate('screens.sign_up.headline', { site: options.companyName })}</h3>

          <div styleName="divider"></div>

          <h4
            styleName="create-new-id"
            dangerouslySetInnerHTML={{ __html: translate('screens.sign_up.prompt_html') }} />

          <h5
            styleName="socrata-powered"
            dangerouslySetInnerHTML={{ __html: translate('screens.sign_in.tips_html') }} />

          {this.renderDisclaimer()}

          <SignUpForm options={options} translate={translate} />

          {this.renderSocialSignIn()}
        </div>
      </Provider>
    );
  }
}

SignUp.propTypes = {
  translate: React.PropTypes.func.isRequired,
  options: OptionsPropType.isRequired
};

export default cssModules(SignUp, styles);
