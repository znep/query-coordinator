import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';

import connectLocalization from 'common/i18n/components/connectLocalization';

import AlertSettingModal from 'common/notifications/components/AlertSettingModal/AlertSettingModal';
import styles from './panel-footer.scss';

class PanelFooter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showAlertSettingModal: false
    };

    _.bindAll(this,
      'closeModal',
      'renderModal',
      'toggleSubscription'
    );
  }

  closeModal() {
    const showAlertSettingModal = false;

    this.setState({showAlertSettingModal});
  }

  renderModal() {
    const { showAlertSettingModal } = this.state;
    const {
      currentUserRole,
      isAdmin
    } = this.props;

    if (showAlertSettingModal) {
      return (
        <AlertSettingModal onClose={this.closeModal}
          isAdmin={isAdmin}
          currentUserRole={currentUserRole} />
      )
    } else {
      return null;
    }
  }

  toggleSubscription() {
    const showAlertSettingModal = !this.state.showAlertSettingModal;

    this.setState({showAlertSettingModal});
  }

  renderClearAllNotificationsPrompt() {
    const {
      clearAllUserNotifications,
      toggleClearAllUserNotificationsPrompt,
      openClearAllUserNotificationsPrompt,
      I18n
    } = this.props;

    if (openClearAllUserNotificationsPrompt) {
      return (
        <div styleName="inline-prompt">
          <p styleName="heading-text">{I18n.t('clear_all_text')}</p>

          <p>{I18n.t('clear_all_confirm')}</p>

          <div styleName="prompt-buttons-wrapper" className="clearfix">
            <button styleName="cancle-button"
              className="btn btn-default"
              onClick={() => { toggleClearAllUserNotificationsPrompt(false) }}>
              {I18n.t('clear_all_confirm_no')}
            </button>

            <button styleName="primary-button" onClick={clearAllUserNotifications}>
              {I18n.t('clear_all_confirm_yes')}
            </button>
          </div>
        </div>
      );
    }
  }

  renderSettingsButton() {
    const { I18n } = this.props;

    return (
      <a className="btn" styleName="setting-btn" onClick={this.toggleSubscription}>
        <span className="socrata-icon-settings"></span>
        {I18n.t('setting')}
      </a>
    );
  }

  renderFooter() {
    const {
      forUserNotifications,
      I18n
    } = this.props;

    if (forUserNotifications) {
      const {
        hasUserNotifications,
        toggleClearAllUserNotificationsPrompt,
        openClearAllUserNotificationsPrompt
      } = this.props;

      return (
        <div styleName="buttons-wrapper" className="clearfix">
          {this.renderClearAllNotificationsPrompt()}

          <button
            styleName="primary-button"
            className="clear-all-button"
            onClick={() => { toggleClearAllUserNotificationsPrompt(!openClearAllUserNotificationsPrompt) }}
            disabled={!hasUserNotifications}>
            {I18n.t('clear_all_text')}
          </button>

          {this.renderSettingsButton()}
        </div>
      );
    } else {
      const {
        hasUnreadNotifications,
        markAllProductNotificationsAsRead
      } = this.props;

      return (
        <div styleName="buttons-wrapper" className="clearfix">
          <button styleName='primary-button'
            className='mark-all-as-read-button'
            disabled={!hasUnreadNotifications}
            onClick={markAllProductNotificationsAsRead}>
            {I18n.t('mark_as_read')}
          </button>

          {this.renderSettingsButton()}
        </div>
      );
    }
  }

  render() {
    return (
      <div styleName='footer-bar'>
        {this.renderFooter()}
        {this.renderModal()}
      </div>
    );
  }
}

PanelFooter.propTypes = {
  clearAllUserNotifications: PropTypes.func,
  forUserNotifications: PropTypes.bool.isRequired,
  hasUnreadNotifications: PropTypes.bool,
  hasUserNotifications: PropTypes.bool,
  markAllProductNotificationsAsRead: PropTypes.func,
  openClearAllUserNotificationsPrompt: PropTypes.bool,
  toggleClearAllUserNotificationsPrompt: PropTypes.func
};

PanelFooter.defaultProp = {
  clearAllUserNotifications: () => {},
  hasUnreadNotifications: false,
  hasUserNotifications: false,
  markAllProductNotificationsAsRead: () => {},
  openClearAllUserNotificationsPrompt: false,
  toggleClearAllUserNotificationsPrompt: () => {}
};

export default connectLocalization(cssModules(PanelFooter, styles));
