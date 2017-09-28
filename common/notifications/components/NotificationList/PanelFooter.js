import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './panel-footer.scss';

class PanelFooter extends Component {
  render() {
    const {
      markAllAsRead,
      markAsReadText,
      hasUnreadNotifications
    } = this.props;

    return (
      <div styleName='footer-bar'>
        <button styleName='primary-button'
          className='mark-all-as-read-button'
          disabled={!hasUnreadNotifications}
          onClick={markAllAsRead}>
          {markAsReadText}
        </button>
      </div>
    );
  }
}

PanelFooter.propTypes = {
  hasUnreadNotifications: PropTypes.bool.isRequired,
  markAllAsRead: PropTypes.func.isRequired,
  markAsReadText: PropTypes.string.isRequired
};

export default cssModules(PanelFooter, styles);
