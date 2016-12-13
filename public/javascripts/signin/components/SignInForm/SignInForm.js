import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import { isValidEmail, findForcedOrEmailDomainConnection } from '../../Util';
import OptionsPropType from '../../PropTypes/OptionsPropType';
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

      // the connection name is found based off of the email
      // either by the email domain or the "forced connections" config option
      connectionName: undefined,

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
    if (isValidEmail(email)) {
      const { auth0Connections, options } = this.props;
      const connectionName = findForcedOrEmailDomainConnection(
        email,
        auth0Connections,
        options.forcedConnections,
        options.socrataEmailsBypassAuth0
      );
      this.setState({ email, connectionName });
    } else {
      this.setState({ email: undefined, connectionName: undefined });
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

  renderErrorOrSpinner() {
    const { error, loggingIn } = this.state;

    if (!_.isEmpty(error)) {
      return (
        <div styleName="login-error">
          <strong>{this.props.translate('screens.sign_in.error')}:</strong> {error.message}
        </div>
      );
    } else if (loggingIn === true) {
      return <span styleName="spinner"></span>;
    }
  }

  renderRememberMe(options, translate) {
    if (options.rememberMe) {
      return <RememberMe translate={translate} />;
    }
  }

  render() {
    const { options, doAuth0Login, auth0Connections, translate } = this.props;
    const { connectionName, email, password } = this.state;
    const { forcedConnections, socrataEmailsBypassAuth0 } = options;

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

        <EmailInput
          onChange={this.onEmailChange}
          translate={translate} />
        <PasswordInput
          onChange={this.onPasswordChange}
          translate={this.props.translate}
          connectionName={connectionName} />

        {this.renderRememberMe(options, translate)}

        <a
          href="/forgot_password"
          styleName="reset-password">
            {translate('screens.sign_in.forgot_password')}
        </a>

        <SignInButton
          form={this.formDomNode}
          connectionName={connectionName}
          doAuth0Login={doAuth0Login}
          translate={this.props.translate}
          email={email}
          password={password}
          onLoginStart={this.onLoginStart}
          onLoginError={this.onLoginError}
          auth0Connections={auth0Connections}
          forcedConnections={forcedConnections}
          socrataEmailsBypassAuth0={socrataEmailsBypassAuth0} />
      </form>
    );
  }
}

SignInForm.propTypes = {
  options: OptionsPropType.isRequired,
  translate: PropTypes.func.isRequired,
  doAuth0Login: PropTypes.func.isRequired,
  auth0Connections: PropTypes.array
};

export default cssModules(SignInForm, styles);
