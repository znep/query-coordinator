import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import SocialButton from './SocialButton';
import styles from './social.scss';
import facebookIcon from 'icons/facebook.svg';
import twitterIcon from 'icons/twitter.svg';
import googleIcon from 'icons/google.svg';
import windowsIcon from 'icons/windows.svg';
import yahooIcon from 'icons/yahoo.svg';

function SocialButtons({ doAuth0Login }) {
  return (
    <div styleName="button-container">
      <SocialButton
        doAuth0Login={doAuth0Login}
        connectionName="facebook"
        icon={facebookIcon}
        style="social-button-facebook" />
      <SocialButton
        doAuth0Login={doAuth0Login}
        connectionName="google-oauth2"
        icon={googleIcon}
        style="social-button-google" />
      <SocialButton
        doAuth0Login={doAuth0Login}
        connectionName="twitter"
        icon={twitterIcon}
        style="social-button-twitter" />
      <SocialButton
        doAuth0Login={doAuth0Login}
        connectionName="windowslive"
        icon={windowsIcon}
        style="social-button-microsoft" />
      <SocialButton
        doAuth0Login={doAuth0Login}
        connectionName="yahoo"
        icon={yahooIcon}
        style="social-button-yahoo" />
    </div>
  );
}

SocialButtons.propTypes = {
  doAuth0Login: PropTypes.func.isRequired
};

export default cssModules(SocialButtons, styles);
