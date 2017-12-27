import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import I18n from 'common/i18n';
import styles from './social-link.module.scss';

class SocialLinkMessage extends Component {
  render() {
    const { signin, toggleViewMode } = this.props;
    return (
      <div styleName="message-container">
        {I18n.t('screens.sign_up.third_party_return')}
        {' '}
        <a
          styleName="link"
          onClick={!signin ? () => {} : () => { toggleViewMode(); }}>
          {I18n.t('screens.sign_up.third_party_return_create')}
        </a>
        {' '}
        {I18n.t('core.or')}
        {' '}
        <a
          styleName="link"
          onClick={signin ? () => {} : () => { toggleViewMode(); }}>
          {I18n.t('screens.sign_up.third_party_return_link')}
        </a>
      </div>
    );
  }
}

SocialLinkMessage.propTypes = {
  signin: PropTypes.bool.isRequired,
  toggleViewMode: PropTypes.func.isRequired
};

export default cssModules(SocialLinkMessage, styles);
