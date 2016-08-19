import React from 'react';
import Auth0 from 'auth0-js';
import cssModules from 'react-css-modules';
import OptionsPropType from './OptionsPropType';
import SignIn from './SignIn';
import ChooseConnection from './ChooseConnection/ChooseConnection';
import styles from './signin.scss';
import backIcon from 'icons/arrow-left.svg';

class SignInContainer extends React.Component {
  constructor(props) {
    super(props);

    const { auth0Uri, auth0ClientId, baseDomainUri } = this.props.options;
    this.state = {
      auth0Client: new Auth0({
        domain: auth0Uri,
        clientID: auth0ClientId,
        callbackURL: `${baseDomainUri}/auth/auth0/callback`
      }),
      auth0Connections: [],
      renderLoginForm: false
    };

    this.renderChooseConnectionOrSignInForm = this.renderChooseConnectionOrSignInForm.bind(this);
    this.onConnectionChosen = this.onConnectionChosen.bind(this);
    this.setLoginFormVisibility = this.setLoginFormVisibility.bind(this);
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
      const doAuth0Login = auth0Client.login.bind(auth0Client);
      return (
        // either there aren't any specific connections set up,
        // or the "Sign in with a Socrata ID" button was clicked
        <SignIn
          doAuth0Login={doAuth0Login}
          auth0Connections={auth0Connections}
          options={options}
          setLoginFormVisibility={this.setLoginFormVisibility} />
      );
    }
  }

  renderBackButton() {
    const { options } = this.props;

    // only show the button to go back to "choose connection" if we're told to
    if (!_.isEmpty(options.connections) && this.state.renderLoginForm === true) {
      return (
        <a
          styleName="back-to-options"
          onClick={() => this.setLoginFormVisibility(false)} >
          <span
            styleName="back-to-options-icon"
            dangerouslySetInnerHTML={{ __html: backIcon }} />
          {$.t('screens.sign_in.back_to_sign_in_selection')}
        </a>
      );
    }
  }

  renderFlashes() {
    if (_.isEmpty(this.props.options.flashes)) {
      return;
    }

    return this.props.options.flashes.map((flash, i) => {
      const level = flash[0];
      const message = flash[1];

      return (
        <div
          styleName={`alert-${level}`}
          key={`alert-${level}-${i}`}
          dangerouslySetInnerHTML={{ __html: message }} />
      );
    });
  }

  render() {
    return (
      <div styleName="container">
        {this.renderBackButton()}

        {this.renderFlashes()}

        <h2 styleName="header">
          {$.t('screens.sign_in.headline', { site: blist.configuration.strings.company })}
        </h2>

        {this.renderChooseConnectionOrSignInForm()}
      </div>
    );
  }
}

SignInContainer.propTypes = {
  options: OptionsPropType
};

export default cssModules(SignInContainer, styles);
