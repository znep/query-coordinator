import React, { PropTypes } from 'react';
import OptionsPropType from '../PropTypes/OptionsPropType';
import SignInContainer from './SignInContainer';
import SignUp from './SignUp';

class SignInSignUpSwitcher extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // if true, we're on sign in, else we're on sign up
      displayingSignIn: props.signin,
      clearFlashes: false
    };

    props.options.toggleViewMode = this.toggleViewMode.bind(this);
  }

  toggleViewMode(clearFlashes = true) {
    this.setState({ displayingSignIn: !this.state.displayingSignIn, clearFlashes: clearFlashes });
  }

  render() {
    const { displayingSignIn, clearFlashes } = this.state;
    const { options } = this.props;
    const opts = { ...options, flashes: clearFlashes ? [] : options.flashes };

    if (displayingSignIn) {
      return (<SignInContainer options={opts} />);
    } else {
      return (<SignUp options={opts} />);
    }
  }
}

SignInSignUpSwitcher.propTypes = {
  signin: PropTypes.bool.isRequired,
  options: OptionsPropType.isRequired
};

export default SignInSignUpSwitcher;
