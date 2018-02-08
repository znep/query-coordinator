import _ from 'lodash';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import connectLocalization from 'common/i18n/components/connectLocalization';
import { SocrataIcon } from 'common/components/SocrataIcon';

import AlertSettingModal from 'common/notifications/components/AlertSettingModal/AlertSettingModal';
import styles from './panel-footer.module.scss';

const scope = 'shared_site_chrome_notifications';

class PanelFooter extends Component {
  state = { showAlertSettingModal: false };

  closeModal = () => {
    this.setState({ showAlertSettingModal: false });
  }

  toggleSubscription = () => {
    this.setState({ showAlertSettingModal: !this.state.showAlertSettingModal });
  }

  renderModal = () => {
    const { showAlertSettingModal } = this.state;
    const {
      currentDomainFeatures,
      currentUserRole,
      inProductTransientNotificationsEnabled,
      isSuperAdmin,
      mapboxAccessToken,
      onShowTransientNotificationsChange,
      showMyAlertPreference
    } = this.props;

    if (showAlertSettingModal) {
      return (
        <AlertSettingModal
          currentDomainFeatures={currentDomainFeatures}
          currentUserRole={currentUserRole}
          inProductTransientNotificationsEnabled={inProductTransientNotificationsEnabled}
          isSuperAdmin={isSuperAdmin}
          mapboxAccessToken={mapboxAccessToken}
          onClose={this.closeModal}
          onShowTransientNotificationsChange={onShowTransientNotificationsChange}
          showMyAlertPreference={showMyAlertPreference} />
      );
    }
  }

  renderClearAllNotificationsPrompt = () => {
    const {
      clearAllUserNotifications,
      I18n,
      openClearAllUserNotificationsPrompt,
      toggleClearAllUserNotificationsPrompt
    } = this.props;

    if (openClearAllUserNotificationsPrompt) {
      return (
        <div styleName="inline-prompt">
          <p styleName="heading-text">{I18n.t('clear_all_text', { scope })}</p>
          <p>{I18n.t('clear_all_confirm', { scope })}</p>
          <div styleName="prompt-buttons-wrapper" className="clearfix">
            <button
              styleName="cancel-button"
              className="btn btn-default"
              onClick={() => toggleClearAllUserNotificationsPrompt(false)}>
              {I18n.t('clear_all_confirm_no', { scope })}
            </button>
            <button styleName="primary-button" onClick={clearAllUserNotifications}>
              {I18n.t('clear_all_confirm_yes', { scope })}
            </button>
          </div>
        </div>
      );
    }
  }

  renderSettingsButton = () => {
    const { I18n, showUserNotifications } = this.props;

    if (showUserNotifications) {
      return (
        <span
          className="btn"
          onClick={this.toggleSubscription}
          role="button"
          styleName="setting-button">
          <SocrataIcon name="settings" />
          <em>{I18n.t('setting', { scope })}</em>
        </span>
      );
    }
  }

  renderFooter = () => {
    const { forUserNotifications, I18n } = this.props;

    if (forUserNotifications) {
      const {
        hasUserNotifications,
        openClearAllUserNotificationsPrompt,
        toggleClearAllUserNotificationsPrompt
      } = this.props;

      return (
        <div styleName="buttons-wrapper" className="clearfix">
          {this.renderClearAllNotificationsPrompt()}
          <button
            className="clear-all-button"
            disabled={!hasUserNotifications}
            onClick={() => toggleClearAllUserNotificationsPrompt(!openClearAllUserNotificationsPrompt)}
            styleName="primary-button">
            {I18n.t('clear_all_text', { scope })}
          </button>
          {this.renderSettingsButton()}
        </div>
      );
    }

    const { hasUnreadNotifications, markAllProductNotificationsAsRead } = this.props;

    return (
      <div styleName="buttons-wrapper" className="clearfix">
        <button
          className="mark-all-as-read-button"
          disabled={!hasUnreadNotifications}
          onClick={markAllProductNotificationsAsRead}
          styleName="primary-button">
          {I18n.t('mark_as_read', { scope })}
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
  hasUnreadNotifications: PropTypes.bool,
  hasUserNotifications: PropTypes.bool,
  inProductTransientNotificationsEnabled: PropTypes.bool,
  markAllProductNotificationsAsRead: PropTypes.func,
  onShowTransientNotificationsChange: PropTypes.func,
  openClearAllUserNotificationsPrompt: PropTypes.bool,
  showMyAlertPreference: PropTypes.bool,
  showUserNotifications: PropTypes.bool.isRequired,
  toggleClearAllUserNotificationsPrompt: PropTypes.func
};

PanelFooter.defaultProp = {
  clearAllUserNotifications: () => {},
  hasUnreadNotifications: false,
  hasUserNotifications: false,
  markAllProductNotificationsAsRead: () => {},
  openClearAllUserNotificationsPrompt: false,
  showUserNotifications: true,
  toggleClearAllUserNotificationsPrompt: () => {}
};

export default connectLocalization(cssModules(PanelFooter, styles));
