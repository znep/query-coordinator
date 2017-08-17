import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import I18n from 'common/i18n';
import Auth0ConnectionsPropType from '../../PropTypes/Auth0ConnectionsPropType';
import ForcedConnectionsPropType from '../../PropTypes/ForcedConnectionsPropType';
import { findForcedOrEmailDomainConnection } from '../../Util';
import styles from './sign-in-form.scss';

class SignInButton extends React.Component {
  constructor(props) {
    super(props);

    this.doSignIn = this.doSignIn.bind(this);
    this.auth0Authorize = this.auth0Authorize.bind(this);
  }

  doSignIn(event) {
    event.preventDefault();

    const {
      onLoginError,
      onLoginStart,
      connectionName,
      email,
      password,
      form,
      auth0Connections,
      forcedConnections,
      socrataEmailsBypassAuth0
    } = this.props;

    // blank out error
    onLoginError(undefined);

    if (!_.isEmpty(connectionName)) {
      // we were passed a connection name; just use that
      this.auth0Authorize(connectionName);
    } else if (!_.isEmpty(email)) {
      // make sure we really shouldn't have a connection...
      const foundConnection = findForcedOrEmailDomainConnection(
        email,
        auth0Connections,
        forcedConnections,
        socrataEmailsBypassAuth0
      );

      if (!_.isEmpty(foundConnection)) {
        // if an email was entered and matched a connection, use that connection
        this.auth0Authorize(foundConnection);
      } else if (!_.isEmpty(password)) {
        // otherwise do a regular ol login
        onLoginStart();
        form.submit();
      }
    }
  }

  auth0Authorize(connectionName) {
    const {
      doAuth0Authorize,
      onLoginStart
    } = this.props;
    onLoginStart();

    // execute Auth0 authorize method for named SSO connection
    doAuth0Authorize({
      connection: connectionName
    });
  }

  render() {
    return (
      <button onClick={this.doSignIn} styleName="sign-in-button">
        {I18n.t('screens.sign_in.form.sign_in_button')}
      </button>
    );
  }
}

SignInButton.propTypes = {
  form: PropTypes.object,
  onLoginError: PropTypes.func.isRequired,
  onLoginStart: PropTypes.func.isRequired,
  connectionName: PropTypes.string,
  doAuth0Authorize: PropTypes.func.isRequired,
  email: PropTypes.string,
  password: PropTypes.string,
  auth0Connections: PropTypes.arrayOf(Auth0ConnectionsPropType),
  forcedConnections: PropTypes.arrayOf(ForcedConnectionsPropType),
  socrataEmailsBypassAuth0: PropTypes.bool
};

export default cssModules(SignInButton, styles);
