import React, { PropTypes } from 'react';
import _ from 'lodash';
import { get as getCookie, set as setCookie, erase as eraseCookie } from 'browser-cookies';
import OptionsPropType from '../PropTypes/OptionsPropType';
import LoginModal from './LoginModal';
import SignInContainer from './SignInContainer';
import SignUp from './SignUp';

class SignInSignUpSwitcher extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // whether or not the modal is being displayed
      // this takes precedence over rendering the signin/signup components
      displayingModal: this.shouldDisplayModal(),

      // if true, we're on sign in, else we're on sign up
      displayingSignIn: props.signin,

      // if this is set to true, then on next render all flashes will be cleared
      clearFlashes: false
    };

    props.options.toggleViewMode = this.toggleViewMode.bind(this);

    this.shouldDisplayModal = this.shouldDisplayModal.bind(this);
    this.confirmModal = this.confirmModal.bind(this);
    this.cancelModal = this.cancelModal.bind(this);
  }

  cookieName() {
    return 'socrata-login-modal-accepted';
  }

  shouldDisplayModal() {
    const modalConfig = this.props.options.modalConfig;

    // only show if we actually have the config
    if (!_.isEmpty(modalConfig)) {
      const expirationMinutes = modalConfig.expirationMinutes;

      // empty or 0 expiration minutes means we show the modal every time
      if (!_.isFinite(expirationMinutes) || expirationMinutes === 0) {
        return true;
      }

      const cookie = getCookie(this.cookieName());

      if (_.isEmpty(cookie)) {
        // no cookie means it hasn't been accepted yet
        return true;
      } else {
        if (expirationMinutes < 0) {
          // negative expiration minutes means the accept never expires as long as the cookie is around
          return false;
        }

        const date = new Date(cookie);
        const differenceMinutes = (new Date() - date) / 60000;

        // cookie has "expired"
        // if the difference is not finite, it means the parsed date is invalid
        if (!isFinite(differenceMinutes) || differenceMinutes > expirationMinutes) {
          eraseCookie(this.cookieName());
          return true;
        }
      }
    }

    return false;
  }

  toggleViewMode(clearFlashes = true) {
    this.setState({ displayingSignIn: !this.state.displayingSignIn, clearFlashes: clearFlashes });
  }

  cancelModal() {
    eraseCookie(this.cookieName());

    window.location = _.get(this.props, 'options.modalConfig.cancelRedirectUrl', '/');
  }

  confirmModal() {
    setCookie(this.cookieName(), new Date().toString());

    this.setState({ displayingModal: false });
  }

  render() {
    const { displayingModal, displayingSignIn, clearFlashes } = this.state;
    const { options } = this.props;
    const opts = { ...options, flashes: clearFlashes ? [] : options.flashes };

    if (displayingModal) {
      return (
        <LoginModal
          modalConfig={options.modalConfig}
          onCancel={this.cancelModal}
          onConfirm={this.confirmModal} />
      );
    } else if (displayingSignIn) {
      return (
        <SignInContainer options={opts} />
      );
    } else {
      return (
        <SignUp options={opts} />
      );
    }
  }
}

SignInSignUpSwitcher.propTypes = {
  signin: PropTypes.bool.isRequired,
  options: OptionsPropType.isRequired
};

export default SignInSignUpSwitcher;
