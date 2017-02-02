import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import SocialButton from './SocialButton';
import styles from './social.scss';

function SocialButtons({ doAuth0Login }) {
  return (
    <div styleName="button-container">
      <SocialButton
        doAuth0Login={doAuth0Login}
        connectionName="facebook"
        icon="facebook"
        style="social-button-facebook" />
      <SocialButton
        doAuth0Login={doAuth0Login}
        connectionName="google-oauth2"
        icon="google"
        style="social-button-google" />
      <SocialButton
        doAuth0Login={doAuth0Login}
        connectionName="twitter"
        icon="twitter"
        style="social-button-twitter" />
      <SocialButton
        doAuth0Login={doAuth0Login}
        connectionName="windowslive"
        icon="windows"
        style="social-button-microsoft" />
      <SocialButton
        doAuth0Login={doAuth0Login}
        connectionName="yahoo"
        icon="yahoo"
        style="social-button-yahoo" />
    </div>
  );
}

SocialButtons.propTypes = {
  doAuth0Login: PropTypes.func.isRequired
};

export default cssModules(SocialButtons, styles);
