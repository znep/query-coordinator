import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import I18n from 'common/i18n';
import SocialButtons from './SocialButtons';
import CircleDivider from '../CircleDivider/CircleDivider';
import styles from './social.scss';

class SocialSignIn extends React.Component {
  render() {
    const { doAuth0Authorize } = this.props;
    return (
      <div styleName="container">
        <CircleDivider text="OR" />

        <h5 styleName="social-title">{I18n.t('screens.sign_in.sign_in_using')}:</h5>
        <SocialButtons doAuth0Authorize={doAuth0Authorize} />
      </div>
    );
  }
}

SocialSignIn.propTypes = {
  doAuth0Authorize: PropTypes.func.isRequired
};

export default cssModules(SocialSignIn, styles);
