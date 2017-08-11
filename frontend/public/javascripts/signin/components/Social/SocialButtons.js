import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import SocialButton from './SocialButton';
import styles from './social.scss';

function SocialButtons({ doAuth0Authorize }) {
  return (
    <div styleName="button-container">
      <SocialButton
        doAuth0Authorize={doAuth0Authorize}
        connectionName="facebook"
        icon="facebook"
        style="social-button-facebook" />
      <SocialButton
        doAuth0Authorize={doAuth0Authorize}
        connectionName="google-oauth2"
        icon="google"
        style="social-button-google" />
      <SocialButton
        doAuth0Authorize={doAuth0Authorize}
        connectionName="twitter"
        icon="twitter"
        style="social-button-twitter" />
      <SocialButton
        doAuth0Authorize={doAuth0Authorize}
        connectionName="windowslive"
        icon="windows"
        style="social-button-microsoft" />
      <SocialButton
        doAuth0Authorize={doAuth0Authorize}
        connectionName="yahoo"
        icon="yahoo"
        style="social-button-yahoo" />
    </div>
  );
}

SocialButtons.propTypes = {
  doAuth0Authorize: PropTypes.func.isRequired
};

export default cssModules(SocialButtons, styles);
