import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import { isValidEmail, findConnection } from '../../Util';
import OptionsPropType from '../../PropTypes/OptionsPropType';
import Auth0ConnectionsPropType from '../../PropTypes/Auth0ConnectionsPropType';
import EmailInput from './EmailInput';
import PasswordInput from './PasswordInput';
import RememberMe from './RememberMe';
import styles from './sign-in-form.scss';

class SignInForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // email is tracked to detect when an SSO email domain
      // is entered, and selects the proper connection
      email: '',

      password: '',

      // the connection name is found based off of the email
      // either by the email domain or the "forced connections" config option
      connectionName: null,

      // any errors that happened during login
      error: null,

      // if this is true, and there are no errors,
      // then a spinner is rendered
      loggingIn: false
    };

    this.onEmailChange = this.onEmailChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.setLoginErrorMessage = this.setLoginErrorMessage.bind(this);
    this.onLoginStart = this.onLoginStart.bind(this);
    this.renderErrorOrSpiiner = this.renderErrorOrSpinner.bind(this);
    this.doSignIn = this.doSignIn.bind(this);
  }

  /**
   * Sets this.state's email, also looks up a matching connection to
   * login with based on the email domain
   */
  onEmailChange(email) {
    if (isValidEmail(email)) {
      const { auth0Connections, options } = this.props;
      const { forcedConnections, socrataEmailsBypassAuth0 } = options;
      const connectionName = findConnection(
        email,
        auth0Connections,
        forcedConnections,
        socrataEmailsBypassAuth0
      );

      this.setState({ email, connectionName });
    } else {
      this.setState({ email: null, connectionName: null });
    }
  }

  onPasswordChange(password) {
    this.setState({ password });
  }

  onLoginStart() {
    this.setState({ loggingIn: true });
  }

  setLoginErrorMessage(error) {
    if (!_.isEmpty(error)) {
      console.error(error);
    }

    this.setState({ error });
  }

  doSignIn(event) {
    event.preventDefault();

    const { options, auth0Connections } = this.props;
    const { connectionName, email } = this.state;
    const { forcedConnections, socrataEmailsBypassAuth0 } = options;

    // blank out error
    this.setLoginErrorMessage(null);

    if (!_.isEmpty(connectionName)) {
      // we already have a connection name; just use that
      this.auth0Login(connectionName);
    } else if (!_.isEmpty(email)) {
      // make sure we *really* shouldn't have a connection...
      const foundConnection = findConnection(
        email,
        auth0Connections,
        forcedConnections,
        socrataEmailsBypassAuth0
      );

      if (!_.isEmpty(foundConnection)) {
        // if an email was entered and matched a connection, use that connection
        this.auth0Login(foundConnection);
      } else {
        // otherwise do a regular ol login
        this.formLogin();
        this.formDomNode.submit();
      }
    } else {
      // by default, we just do a login when the fields are blank;
      // frontend will redirect back to the login page with a flash
      // describing what went wrong.
      this.formLogin();
    }
  }

  auth0Login(connectionName) {
    const { doAuth0Login } = this.props;
    this.onLoginStart();

    // SSO connection
    doAuth0Login({
      connection: connectionName
    });
  }

  formLogin() {
    this.onLoginStart();
    this.formDomNode.submit();
  }

  renderErrorOrSpinner() {
    const { error, loggingIn } = this.state;

    if (!_.isEmpty(error)) {
      return (
        <div className="signin-form-error" styleName="login-error">
          <strong>{this.props.translate('screens.sign_in.error')}:</strong> {error.message}
        </div>
      );
    } else if (loggingIn === true) {
      return <span className="signin-form-spinner" styleName="spinner"></span>;
    }
  }

  renderRememberMe(options, translate) {
    if (options.rememberMe) {
      return <RememberMe translate={translate} />;
    }
  }

  render() {
    const { options, translate } = this.props;
    const { connectionName } = this.state;
    const { authenticityToken, disableSignInAutocomplete } = options;

    return (
      <form
        styleName="form"
        ref={(formDomNode) => { this.formDomNode = formDomNode; }}
        action="/user_sessions"
        method="post"
        autoComplete={disableSignInAutocomplete ? 'off' : 'on'}>
        {this.renderErrorOrSpinner()}

        { /* These are for submitting straight to rails */ }
        <input name="utf8" type="hidden" value="✓" />
        <input
          name="authenticity_token"
          type="hidden"
          value={authenticityToken} />

        <EmailInput
          onChange={this.onEmailChange}
          translate={translate} />
        <PasswordInput
          onChange={this.onPasswordChange}
          translate={translate}
          connectionName={connectionName} />

        {this.renderRememberMe(options, translate)}

        <a
          href="/forgot_password"
          styleName="reset-password">
            {translate('screens.sign_in.forgot_password')}
        </a>

        <button onClick={this.doSignIn} styleName="sign-in-button">
          {translate('screens.sign_in.form.sign_in_button')}
        </button>
      </form>
    );
  }
}

SignInForm.propTypes = {
  options: OptionsPropType.isRequired,
  translate: PropTypes.func.isRequired,
  doAuth0Login: PropTypes.func.isRequired,
  auth0Connections: PropTypes.arrayOf(Auth0ConnectionsPropType)
};

export default cssModules(SignInForm, styles);
