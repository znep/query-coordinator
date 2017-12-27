import React from 'react';
import auth0 from 'auth0-js';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import { SocrataIcon } from 'common/components';
import I18n from 'common/i18n';
import { renderAlerts } from '../Util';
import OptionsPropType from '../PropTypes/OptionsPropType';
import SignIn from './SignIn';
import ChooseConnection from './ChooseConnection/ChooseConnection';
import SocialLinkMessage from './SocialLinkMessage';
import styles from './signin.module.scss';

class SignInContainer extends React.Component {
  constructor(props) {
    super(props);

    const { auth0Uri, auth0ClientId, baseDomainUri } = this.props.options;

    this.state = {
      auth0Client: new auth0.WebAuth({
        domain: auth0Uri,
        clientID: auth0ClientId,
        responseType: 'code',
        redirectUri: `${baseDomainUri}/auth/auth0/callback`
      }),
      auth0Connections: [],
      renderLoginForm: false,
      alerts: []
    };

    _.bindAll(this, [
      'onConnectionChosen',
      'onLoginError',
      'onLoginStart',
      'renderChooseConnectionOrSignInForm',
      'renderFormMessage',
      'renderSocialLinkMessage',
      'setLoginFormVisibility'
    ]);
  }

  componentDidMount() {
    // get a list of all connections from auth0
    // setting the state forces a re-render but then all child components have access to the list
    // the list is used for i.e. finding email domains that use SSO
    fetch(`${this.props.options.baseDomainUri}/auth/auth0/connections`).then((response) => {
      return response.json().then((connections) => {
        this.setState({ auth0Connections: connections });
      });
    });
  }

  onConnectionChosen(connection) {
    this.state.auth0Client.authorize({ connection });
  }

  onLoginStart() {
    // clear out alerts on login start
    this.setState({ alerts: [] });
  }

  onLoginError(level, message) {
    this.setState({ alerts: [[level, message]] });
  }

  setLoginFormVisibility(show) {
    this.setState({ renderLoginForm: show });
  }

  renderChooseConnectionOrSignInForm() {
    const { options } = this.props;
    const { auth0Client, auth0Connections, renderLoginForm } = this.state;

    // if "auth0_connections" is set in the site config, we show a list
    // of buttons to choose a connection
    if (!_.isEmpty(options.connections) && renderLoginForm === false) {
      return (
        <ChooseConnection
          options={options}
          onConnectionChosen={this.onConnectionChosen}
          setLoginFormVisibility={this.setLoginFormVisibility} />);
    } else {
      const doAuth0Authorize = auth0Client.authorize.bind(auth0Client);
      const doAuth0Login = auth0Client.redirect.loginWithCredentials.bind(auth0Client);
      return (
        // either there aren't any specific connections set up,
        // or the "Sign in with a Socrata ID" button was clicked
        <SignIn
          doAuth0Authorize={doAuth0Authorize}
          doAuth0Login={doAuth0Login}
          onLoginStart={this.onLoginStart}
          onLoginError={this.onLoginError}
          auth0Connections={auth0Connections}
          options={options}
          setLoginFormVisibility={this.setLoginFormVisibility} />
      );
    }
  }

  renderFormMessage() {
    const { formMessage, connections } = this.props.options;
    const renderingLoginForm = _.isEmpty(connections) || this.state.renderLoginForm === true;

    if (renderingLoginForm && !_.isEmpty(formMessage)) {
      return (
        <div
          className="signin-form-message"
          dangerouslySetInnerHTML={{ __html: formMessage }} />
      );
    }
  }

  renderBackButton() {
    const { options } = this.props;
    const { renderLoginForm } = this.state;

    // only show the button to go back to "choose connection" if we're told to
    if (!_.isEmpty(options.connections) && renderLoginForm === true) {
      return (
        <a
          className="signin-button-back-to-options"
          styleName="back-to-options"
          onClick={() => this.setLoginFormVisibility(false)} >
          <span styleName="back-to-options-icon">
            <SocrataIcon name="arrow-left" />
            <div
              dangerouslySetInnerHTML={{ __html: I18n.t('screens.sign_in.back_to_sign_in_selection') }} />
          </span>
        </a>
      );
    }
  }

  renderSocialLinkMessage() {
    const { options } = this.props;
    const { linkingSocial, toggleViewMode } = options;

    if (!linkingSocial) {
      return null;
    }

    return (
      <SocialLinkMessage signin toggleViewMode={toggleViewMode} />
    );
  }

  render() {
    const { alerts } = this.state;
    const { options } = this.props;
    const { flashes } = options;
    return (
      <div styleName="container">
        {this.renderBackButton()}
        {renderAlerts(_.concat(flashes, alerts))}
        {this.renderSocialLinkMessage()}

        <div styleName="header-container">
          <h2 styleName="header">
            {
              I18n.t(
                'screens.sign_in.headline',
                { site: options.companyName }
              )
            }
          </h2>

          {this.renderFormMessage()}
        </div>
        {this.renderChooseConnectionOrSignInForm()}
      </div>
    );
  }
}

SignInContainer.propTypes = {
  options: OptionsPropType.isRequired
};

export default cssModules(SignInContainer, styles);
