import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import I18n from 'common/i18n';
import { isValidEmail, findConnection } from '../../Util';
import { processAuth0Error } from '../../Auth0Errors';
import OptionsPropType from '../../PropTypes/OptionsPropType';
import Auth0ConnectionsPropType from '../../PropTypes/Auth0ConnectionsPropType';
import EmailInput from './EmailInput';
import PasswordInput from './PasswordInput';
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

    _.bindAll(this, [
      'doSignIn',
      'onEmailChange',
      'onLoginError',
      'onLoginStart',
      'onPasswordChange',
      'setLoginErrorMessage'
    ]);
  }

  /**
   * Sets this.state's email, also looks up a matching connection to
   * login with based on the email domain
   */
  onEmailChange(event) {
    const email = event.target.value;

    if (isValidEmail(email)) {
      const { auth0Connections, options } = this.props;
      const {
        forcedConnections,
        socrataEmailsBypassAuth0,
        allowUsernamePasswordLogin } = options;

      if (allowUsernamePasswordLogin === false) {
        const connectionName = findConnection(
          email,
          auth0Connections,
          forcedConnections,
          socrataEmailsBypassAuth0
        );

        this.setState({ email, connectionName });
      } else {
        this.setState({ email });
      }
    } else {
      this.setState({ email: null, connectionName: null });
    }
  }

  onPasswordChange(event) {
    this.setState({ password: event.target.value });
  }

  onLoginStart() {
    this.props.onLoginStart();
    this.setState({ loggingIn: true });
  }

  onLoginError(error) {
    this.setState({ loggingIn: false, password: '' });

    const { level, message } = processAuth0Error(error);
    this.props.onLoginError(level, message);
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
    const {
        forcedConnections,
        socrataEmailsBypassAuth0,
        allowUsernamePasswordLogin } = options;

    // blank out error
    this.setLoginErrorMessage(null);

    if (!_.isEmpty(connectionName)) {
      // we already have a connection name; just use that
      this.auth0Login(connectionName);
    } else if (!_.isEmpty(email) && allowUsernamePasswordLogin === false) {
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
      }
    } else {
      // by default, we just do a login when the fields are blank;
      // frontend will redirect back to the login page with a flash
      // describing what went wrong.
      this.formLogin();
    }
  }

  auth0Login(connectionName) {
    const { doAuth0Authorize } = this.props;
    this.onLoginStart();

    // execute Auth0 authorize method for named SSO connection
    doAuth0Authorize({
      connection: connectionName
    });
  }

  formLogin() {
    const { doAuth0Login, options } = this.props;
    const { email, password } = this.state;
    const { auth0DatabaseConnection, allowUsernamePasswordLogin } = options;
    this.onLoginStart();

    if (allowUsernamePasswordLogin) {
      this.formDomNode.submit();
    } else {
      // execute Auth0 login method with user credentials
      doAuth0Login({
        connection: auth0DatabaseConnection,
        username: email,
        password: password
      }, (error) => { this.onLoginError(error); });
    }
  }

  shouldRenderSpinner() {
    const { error, loggingIn } = this.state;

    return _.isEmpty(error) && loggingIn === true;
  }

  renderButtonContents() {
    if (this.shouldRenderSpinner()) {
      return (<span className="signin-form-spinner" styleName="spinner"></span>);
    } else {
      return I18n.t('screens.sign_in.form.sign_in_button');
    }
  }

  renderError() {
    const { error } = this.state;

    if (!_.isEmpty(error)) {
      return (
        <div className="signin-form-error" styleName="login-error">
          <strong>{I18n.t('screens.sign_in.error')}:</strong> {error.message}
        </div>
      );
    }

    return null;
  }

  render() {
    const { options } = this.props;
    const { connectionName } = this.state;
    const { authenticityToken, disableSignInAutocomplete } = options;

    const shouldRenderSpinner = this.shouldRenderSpinner();

    return (
      <form
        styleName="form"
        ref={(formDomNode) => { this.formDomNode = formDomNode; }}
        action="/user_sessions"
        method="post"
        onSubmit={this.doSignIn}
        autoComplete={disableSignInAutocomplete ? 'off' : 'on'}>
        {this.renderError()}

        { /* These are for submitting straight to rails */ }
        <input name="utf8" type="hidden" value="✓" />
        <input
          name="authenticity_token"
          type="hidden"
          value={authenticityToken} />

        <EmailInput onChange={this.onEmailChange} />
        <PasswordInput
          onChange={this.onPasswordChange}
          connectionName={connectionName} />

        <a
          href="/forgot_password"
          styleName="reset-password">
            {I18n.t('screens.sign_in.forgot_password')}
        </a>

        <button
          onClick={this.doSignIn}
          styleName={shouldRenderSpinner ? 'sign-in-button-with-spinner' : 'sign-in-button'}>
          {this.renderButtonContents()}
        </button>
      </form>
    );
  }
}

SignInForm.propTypes = {
  options: OptionsPropType.isRequired,
  doAuth0Authorize: PropTypes.func.isRequired,
  doAuth0Login: PropTypes.func.isRequired,
  onLoginStart: PropTypes.func.isRequired,
  onLoginError: PropTypes.func.isRequired,
  auth0Connections: PropTypes.arrayOf(Auth0ConnectionsPropType)
};

export default cssModules(SignInForm, styles);
