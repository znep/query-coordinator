import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import _ from 'lodash';

import connectLocalization from 'common/i18n/components/connectLocalization';

import AlertSettingModal from 'common/notifications/components/AlertSettingModal/AlertSettingModal';
import { SocrataIcon } from 'common/components/SocrataIcon';
import styles from './panel-footer.module.scss';

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

    this.setState({ showAlertSettingModal });
  }

  renderModal() { // eslint-disable-line react/sort-comp
    const { showAlertSettingModal } = this.state;
    const {
      currentUserRole,
      isSuperAdmin,
      currentDomainFeatures,
      showMyAlertPreference,
      inProductTransientNotificationsEnabled,
      onShowTransientNotificationsChange
    } = this.props;

    if (showAlertSettingModal) {
      return (
        <AlertSettingModal
          onClose={this.closeModal}
          isSuperAdmin={isSuperAdmin}
          currentDomainFeatures={currentDomainFeatures}
          showMyAlertPreference={showMyAlertPreference}
          inProductTransientNotificationsEnabled={inProductTransientNotificationsEnabled}
          onShowTransientNotificationsChange={onShowTransientNotificationsChange}
          currentUserRole={currentUserRole} />
      );
    }
  }

  toggleSubscription() {
    const showAlertSettingModal = !this.state.showAlertSettingModal;

    this.setState({ showAlertSettingModal });
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
          <p styleName="heading-text">
            {I18n.t('shared_site_chrome_notifications.clear_all_text')}</p>

          <p>{I18n.t('shared_site_chrome_notifications.clear_all_confirm')}</p>

          <div styleName="prompt-buttons-wrapper" className="clearfix">
            <button
              styleName="cancel-button"
              className="btn btn-default"
              onClick={() => toggleClearAllUserNotificationsPrompt(false)}>
              {I18n.t('shared_site_chrome_notifications.clear_all_confirm_no')}
            </button>

            <button styleName="primary-button" onClick={clearAllUserNotifications}>
              {I18n.t('shared_site_chrome_notifications.clear_all_confirm_yes')}
            </button>
          </div>
        </div>
      );
    }
  }

  renderSettingsButton() {
    const { I18n, showUserNotifications } = this.props;

    if (showUserNotifications) {
      return (
        <span
          className="btn"
          styleName="setting-button"
          onClick={this.toggleSubscription}
          role="button">
          <SocrataIcon name="settings" />
          <em>{I18n.t('shared_site_chrome_notifications.setting')}</em>
        </span>
      );
    }
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
            onClick={() => toggleClearAllUserNotificationsPrompt(!openClearAllUserNotificationsPrompt)}
            disabled={!hasUserNotifications}>
            {I18n.t('shared_site_chrome_notifications.clear_all_text')}
          </button>

          {this.renderSettingsButton()}
        </div>
      );
    }

    const {
      hasUnreadNotifications,
      markAllProductNotificationsAsRead
    } = this.props;

    return (
      <div styleName="buttons-wrapper" className="clearfix">
        <button
          styleName="primary-button"
          className="mark-all-as-read-button"
          disabled={!hasUnreadNotifications}
          onClick={markAllProductNotificationsAsRead}>
          {I18n.t('shared_site_chrome_notifications.mark_as_read')}
        </button>

        {this.renderSettingsButton()}
      </div>
    );
  }

  render() {
    return (
      <div styleName="footer-bar">
        {this.renderFooter()}
        {this.renderModal()}
      </div>
    );
  }
}

PanelFooter.propTypes = {
  clearAllUserNotifications: PropTypes.func,
  forUserNotifications: PropTypes.bool.isRequired,
  showUserNotifications: PropTypes.bool.isRequired,
  hasUnreadNotifications: PropTypes.bool,
  hasUserNotifications: PropTypes.bool,
  markAllProductNotificationsAsRead: PropTypes.func,
  onShowTransientNotificationsChange: PropTypes.func,
  openClearAllUserNotificationsPrompt: PropTypes.bool,
  toggleClearAllUserNotificationsPrompt: PropTypes.func,
  showMyAlertPreference: PropTypes.bool,
  inProductTransientNotificationsEnabled: PropTypes.bool
};

PanelFooter.defaultProp = {
  clearAllUserNotifications: () => {},
  hasUnreadNotifications: false,
  showUserNotifications: true,
  hasUserNotifications: false,
  markAllProductNotificationsAsRead: () => {},
  openClearAllUserNotificationsPrompt: false,
  toggleClearAllUserNotificationsPrompt: () => {}
};

export default connectLocalization(cssModules(PanelFooter, styles));
