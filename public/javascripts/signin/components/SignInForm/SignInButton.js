import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import styles from './sign-in-form.scss';

class SignInButton extends React.Component {
  constructor(props) {
    super(props);

    this.doSignIn = this.doSignIn.bind(this);
  }

  doSignIn(event) {
    event.preventDefault();

    const {
      doAuth0Login,
      onLoginError,
      onLoginStart,
      connection,
      email,
      password,
      form
    } = this.props;

    // blank out error
    onLoginError(undefined);

    if (connection !== undefined) {
      onLoginStart();

      // SSO connection
      doAuth0Login({
        connection: connection.name
      });
    } else if (!_.isEmpty(email) && !_.isEmpty(password)) {
      onLoginStart();
      form.submit();
    }
  }

  render() {
    return (
      <button onClick={this.doSignIn} styleName="sign-in-button">
        {$.t('screens.sign_in.form.sign_in_button')}
      </button>
    );
  }
}

SignInButton.propTypes = {
  form: PropTypes.object,
  onLoginError: PropTypes.func.isRequired,
  onLoginStart: PropTypes.func.isRequired,
  connection: PropTypes.object,
  doAuth0Login: PropTypes.func.isRequired,
  email: PropTypes.string,
  password: PropTypes.string
};

export default cssModules(SignInButton, styles);
