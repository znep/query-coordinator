import React from 'react';
import cssModules from 'react-css-modules';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import Auth0 from 'auth0-js';
import url from 'url';
import { Translate, renderAlerts } from '../Util';
import signUpReducer from '../reducers/SignUpReducer';
import OptionsPropType from '../PropTypes/OptionsPropType';
import styles from './signup.scss';
import SignUpForm from './SignUpForm/SignUpForm';
import SocialSignIn from './Social/SocialSignIn';

class SignUp extends React.Component {
  constructor(props) {
    super(props);

    const { auth0Uri, auth0ClientId, baseDomainUri, translations, params } = this.props.options;

    const parsedUrl = url.parse(window.location.href, true);
    const urlAuthToken = _.get(parsedUrl, 'query.auth_token', '');

    // if an email comes in from the query string, we want to use that,
    // otherwise grab it from params, otherwise empty
    const email = _.get(parsedUrl, 'query.email', _.get(params, 'signup.email', ''));
    const screenName = _.get(params, 'signup.screenName', '');

    const translate = new Translate(translations);

    this.state = {
      auth0Client: new Auth0({
        domain: auth0Uri,
        clientID: auth0ClientId,
        callbackURL: `${baseDomainUri}/auth/auth0/callback`
      }),
      translate: translate.get
    };

    const defaultState = {
      formSubmitted: false,
      urlAuthToken,
      inputs: {
        email: {
          value: email,
          valid: true,
          message: ''
        },
        screenName: {
          value: screenName,
          valid: true,
          message: ''
        },
        password: {
          value: '',
          valid: true,
          message: ''
        },
        passwordConfirm: {
          value: '',
          valid: true,
          message: ''
        },
        recaptcha: {
          valid: false
        }
      }
    };

    this.store = createStore(
      signUpReducer(translate.get),
      defaultState
    );

    this.renderSocialSignIn = this.renderSocialSignIn.bind(this);
    this.renderDisclaimer = this.renderDisclaimer.bind(this);
  }

  renderSocialSignIn() {
    // only render social sign-in if module is enabled
    if (this.props.options.showSocial) {
      const { auth0Client } = this.state;
      const doAuth0Login = auth0Client.login.bind(auth0Client);
      return <SocialSignIn doAuth0Login={doAuth0Login} translate={this.state.translate} />;
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
    const { translate } = this.state;
    const { options } = this.props;

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
  options: OptionsPropType.isRequired
};

export default cssModules(SignUp, styles);
