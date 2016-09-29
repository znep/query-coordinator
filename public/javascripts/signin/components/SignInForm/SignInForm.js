import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import OptionsPropType from '../OptionsPropType';
import EmailInput from './EmailInput';
import PasswordInput from './PasswordInput';
import SignInButton from './SignInButton';
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

      // the connection is found based off of the email domain
      connection: undefined,

      // any errors that happened during login
      error: undefined,

      // if this is true, and there are no errors,
      // then a spinner is rendered
      loggingIn: false
    };

    this.onEmailChange = this.onEmailChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.onLoginError = this.onLoginError.bind(this);
    this.onLoginStart = this.onLoginStart.bind(this);
    this.renderErrorOrSpiiner = this.renderErrorOrSpinner.bind(this);
  }

  /**
   * Sets this.state's email, also looks up a matching connection to
   * login with based on the email domain
   */
  onEmailChange(email) {
    if (this.isValidEmail(email)) {
      const connection = this.findConnection(email, this.props.auth0Connections);
      this.setState({ email, connection });
    } else {
      this.setState({ email: undefined, connection: undefined });
    }
  }

  onPasswordChange(password) {
    this.setState({ password });
  }

  onLoginStart() {
    this.setState({ loggingIn: true });
  }

  onLoginError(error) {
    if (error !== undefined) {
      console.error(error);
    }

    this.setState({ error });
  }

  /**
   * This finds the connection in the list of connections that matches the given email.
   * If no such connection is found, undefined is returned instead.
   */
  findConnection(email, connections) {
    const emailSplit = email.split('@');

    if (emailSplit.length !== 2) {
      return undefined;
    }

    const emailDomain = emailSplit[1];

    // this option allows users with @socrata.com emails to login directly to rails and
    // bypass auth0; note that this is also enforced in the user_sessions controller
    if (this.props.options.socrataEmailsBypassAuth0 && emailDomain === 'socrata.com') {
      return undefined;
    }

    return _.find(connections, (connection) => {
      const { status, domain_aliases } = connection;
      return status === true && _.includes(domain_aliases, emailDomain);
    });
  }

  /**
   * Currently, anything with an @ followed by text is considered "valid"
   * This is so for SSO (federated) email adresses you can just type @whatever
   * and be sent to the right login system (i.e. just typing "@socrata" will log you
   * in with our login system)
   */
  isValidEmail(email) {
    return email.match(/@.+/);
  }

  renderErrorOrSpinner() {
    const { error, loggingIn } = this.state;

    if (!_.isEmpty(error)) {
      return (
        <div styleName="login-error">
          <strong>{$.t('screens.sign_in.error')}:</strong> {error.message}
        </div>
      );
    } else if (loggingIn === true) {
      return <span styleName="spinner"></span>;
    }
  }

  renderRememberMe() {
    if (this.props.options.rememberMe) {
      return <RememberMe />;
    }
  }

  render() {
    const { options, doAuth0Login } = this.props;
    const { connection, email, password } = this.state;

    return (
      <form
        styleName="form"
        ref={(formDomNode) => { this.formDomNode = formDomNode; }}
        action="/user_sessions"
        method="post">
        {this.renderErrorOrSpinner()}

        { /* These are for submitting straight to rails */ }
        <input name="utf8" type="hidden" value="✓" />
        <input
          name="authenticity_token"
          type="hidden"
          value={options.authenticityToken} />

        <EmailInput onChange={this.onEmailChange} />
        <PasswordInput onChange={this.onPasswordChange} connection={connection} />

        {this.renderRememberMe()}

        <a
          href="/forgot_password"
          styleName="reset-password">
            {$.t('screens.sign_in.forgot_password')}
        </a>

        <SignInButton
          form={this.formDomNode}
          connection={connection}
          doAuth0Login={doAuth0Login}
          email={email}
          password={password}
          onLoginStart={this.onLoginStart}
          onLoginError={this.onLoginError} />
      </form>
    );
  }
}

SignInForm.propTypes = {
  options: OptionsPropType,
  doAuth0Login: PropTypes.func.isRequired,
  auth0Connections: PropTypes.array
};

export default cssModules(SignInForm, styles);
