import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import SocialButtons from './SocialButtons';
import CircleDivider from '../CircleDivider/CircleDivider';
import styles from './social.scss';

function SocialSignIn({ doAuth0Authorize, translate }) {
  return (
    <div styleName="container">
      <CircleDivider text="OR" />

      <h5 styleName="social-title">{translate('screens.sign_in.sign_in_using')}:</h5>
      <SocialButtons doAuth0Authorize={doAuth0Authorize} />
    </div>
  );
}

SocialSignIn.propTypes = {
  doAuth0Authorize: PropTypes.func.isRequired,
  translate: PropTypes.func.isRequired
};

export default cssModules(SocialSignIn, styles);
