import React from 'react';
import Auth0 from 'auth0-js';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'socrata-components';
import { Translate, renderAlerts } from '../Util';
import OptionsPropType from '../PropTypes/OptionsPropType';
import SignIn from './SignIn';
import ChooseConnection from './ChooseConnection/ChooseConnection';
import styles from './signin.scss';

class SignInContainer extends React.Component {
  constructor(props) {
    super(props);

    const { auth0Uri, auth0ClientId, baseDomainUri, translations } = this.props.options;
    const translate = new Translate(translations);

    this.state = {
      auth0Client: new Auth0({
        domain: auth0Uri,
        clientID: auth0ClientId,
        callbackURL: `${baseDomainUri}/auth/auth0/callback`
      }),
      auth0Connections: [],
      renderLoginForm: false,
      translate: translate.get
    };

    this.renderChooseConnectionOrSignInForm = this.renderChooseConnectionOrSignInForm.bind(this);
    this.onConnectionChosen = this.onConnectionChosen.bind(this);
    this.setLoginFormVisibility = this.setLoginFormVisibility.bind(this);
    this.renderFormMessage = this.renderFormMessage.bind(this);
  }

  componentDidMount() {
    // get a list of all connections from auth0
    // setting the state forces a re-render but then all child components have access to the list
    // the list is used for i.e. finding email domains that use SSO
    this.state.auth0Client.getConnections((error, auth0Connections) => {
      if (error) {
        console.error(error);
        return;
      }

      this.setState({ auth0Connections });
    });
  }

  onConnectionChosen(connection) {
    this.state.auth0Client.login({ connection });
  }

  setLoginFormVisibility(show) {
    this.setState({ renderLoginForm: show });
  }

  renderChooseConnectionOrSignInForm() {
    const { options } = this.props;
    const { auth0Client, auth0Connections, renderLoginForm, translate } = this.state;

    // if "auth0_connections" is set in the site config, we show a list
    // of buttons to choose a connection
    if (!_.isEmpty(options.connections) && renderLoginForm === false) {
      return (
        <ChooseConnection
          options={options}
          translate={this.state.translate}
          onConnectionChosen={this.onConnectionChosen}
          setLoginFormVisibility={this.setLoginFormVisibility} />);
    } else {
      const doAuth0Login = auth0Client.login.bind(auth0Client);
      return (
        // either there aren't any specific connections set up,
        // or the "Sign in with a Socrata ID" button was clicked
        <SignIn
          translate={translate}
          doAuth0Login={doAuth0Login}
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
    const { renderLoginForm, translate } = this.state;

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
              dangerouslySetInnerHTML={{ __html: translate('screens.sign_in.back_to_sign_in_selection') }} />
          </span>
        </a>
      );
    }
  }

  render() {
    const { translate } = this.state;
    const { options } = this.props;
    const { flashes } = options;
    return (
      <div styleName="container">
        {this.renderBackButton()}

        {renderAlerts(flashes)}

        <div styleName="header-container">
          <h2 styleName="header">
            {
              translate(
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
