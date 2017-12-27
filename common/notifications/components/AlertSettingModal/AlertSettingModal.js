import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import styles from './alert-setting-modal.module.scss';
import Tabs from './Tabs';
import PreferenceContent from './PreferenceContent';
import cssModules from 'react-css-modules';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';
import AlertPreferenceAPI from '../../api/AlertPreferenceAPI';
import ErrorMessage from 'common/notifications/components/ErrorMessage';
import Spinner from '../Spinner';
import I18n from 'common/i18n';

class AlertSettingModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      selectedTab: 'notification',
      preferences: {},
      settings: {},
      showSpinner: false,
      userPreferencesLoaded: false,
      failedLoadingUserPreferences: false
    };

    this.onTabChange = this.onTabChange.bind(this);
    this.onAlertNotificationChange = this.onAlertNotificationChange.bind(this);
    this.onSettingsChange = this.onSettingsChange.bind(this);
    this.saveAlertSettings = this.saveAlertSettings.bind(this);
  }

  componentWillMount() {
    let userPreferencesLoaded = false;
    let failedLoadingUserPreferences = false;

    this.setState({ userPreferencesLoaded, failedLoadingUserPreferences });

    AlertPreferenceAPI.get().then((response) => {
      const preferences = _.get(response, 'subscription_preferences', {});
      const settings = _.get(response, 'settings', {});
      userPreferencesLoaded = true;
      failedLoadingUserPreferences = false;

      this.setState({ preferences, userPreferencesLoaded, failedLoadingUserPreferences, settings });
    }).
    catch((error) => {
      failedLoadingUserPreferences = true;
      userPreferencesLoaded = false;

      this.setState({ userPreferencesLoaded, failedLoadingUserPreferences });
    });
  }

  onAlertNotificationChange(category, notificationType, subCategoryType) {
    let { preferences } = this.state;
    let categoryData = _.get(preferences, category, {});
    if (categoryData) {
      if (notificationType == 'email') {
        categoryData.enable_email = !categoryData.enable_email;
      } else if (notificationType == 'product') {
        categoryData.enable_product_notification = !categoryData.enable_product_notification;
      }
      if (!_.isUndefined(subCategoryType)) {
        let subCategoryData = _.get(categoryData, ['sub_categories', subCategoryType], {});
        subCategoryData.enable = !subCategoryData.enable;
        if (_.isUndefined(categoryData.sub_categories)) {
          categoryData.sub_categories = {};
        }
        categoryData.sub_categories[subCategoryType] = subCategoryData;
      }
    }
    preferences[category] = categoryData;
    this.setState({ preferences });
  }

  onSettingsChange(category, options) {
    let { settings } = this.state;
    let categoryData = _.get(settings, category + '[0]', {});

    categoryData.name = category;
    categoryData.enable = (_.isUndefined(options.enable) ? categoryData.enable : options.enable);
    categoryData.value = (_.isUndefined(options.value) ? categoryData.value : options.value);
    categoryData.type = (_.isUndefined(options.type) ? categoryData.type : options.type);

    settings[category] = [categoryData];

    if (_.isEqual(category, 'in_product_transient')) {
      const { onShowTransientNotificationsChange } = this.props;

      onShowTransientNotificationsChange(categoryData.enable);
    }

    this.setState({ settings });
  }

  onTabChange(selectedTab) {
    this.setState({ selectedTab });
  }

  renderNotificationTabContent() { // eslint-disable-line react/sort-comp
    const { userPreferencesLoaded, failedLoadingUserPreferences } = this.state;

    if (userPreferencesLoaded) {
      const {
        currentUserRole,
        isSuperAdmin,
        currentDomainFeatures,
        showMyAlertPreference,
        inProductTransientNotificationsEnabled
      } = this.props;

      return (
        <PreferenceContent
          currentUserRole={currentUserRole}
          isSuperAdmin={isSuperAdmin}
          currentDomainFeatures={currentDomainFeatures}
          onAlertNotificationChange={this.onAlertNotificationChange}
          onSettingsChange={this.onSettingsChange}
          settings={this.state.settings}
          showMyAlertPreference={showMyAlertPreference}
          inProductTransientNotificationsEnabled={inProductTransientNotificationsEnabled}
          preferences={this.state.preferences} />
      );
    } else if (failedLoadingUserPreferences) {
      const errorText = I18n.t('error_loading_preferences_text_html', { scope: 'shared_site_chrome_notifications.alert_setting_modal' });

      return (
        <div styleName="user-preferences-error-message-wrapper">
          <ErrorMessage text={errorText} />
        </div>
      );
    }

    return (
      <div styleName="user-preferences-loading-wrapper">
        <Spinner />
      </div>
    );
  }

  saveAlertSettings() {
    const { preferences, settings } = this.state;
    const { onClose } = this.props;
    let { showSpinner } = this.state;
    showSpinner = true;
    this.setState({ showSpinner });
    AlertPreferenceAPI.set(preferences, settings).then(() => {
      showSpinner = false;
      this.setState({ showSpinner });
      onClose();
    }).
    catch(() => {
      showSpinner = false;
      this.setState({ showSpinner });
    });
  }

  renderTabs() {
    const { userPreferencesLoaded, selectedTab } = this.state;

    if (userPreferencesLoaded) {
      return <Tabs onTabChange={this.onTabChange} selectedTab={selectedTab} />;
    }
  }

  renderTabContent() {
    return this.renderNotificationTabContent();
  }

  renderModalFooter() {
    const { userPreferencesLoaded } = this.state;

    if (userPreferencesLoaded) {
      const { onClose } = this.props;

      return (
        <ModalFooter>
          <div styleName="cancel-button" className="cancel-button" onClick={onClose}>
            {I18n.t('cancel', { scope: 'shared_site_chrome_notifications.alert_setting_modal' })}
          </div>

          <div styleName="save-button" className="save-button" onClick={this.saveAlertSettings}>
            {I18n.t('save', { scope: 'shared_site_chrome_notifications.alert_setting_modal' })}
          </div>
        </ModalFooter>
      );
    }
  }

  render() {
    const { onClose } = this.props;
    const containerStyle = {
      'maxWidth': '800px',
      'maxHeight': 'calc(100vh - 40px)',
      'padding': '20px',
      'margin': '20px auto',
      'bottom': 'auto'
    };

    return (
      <Modal styleName="alert-setting-modal" onDismiss={onClose} containerStyle={containerStyle}>
        <ModalHeader
          title={I18n.t('settings', { scope: 'shared_site_chrome_notifications.alert_setting_modal' })}
          onDismiss={onClose} />

        <ModalContent styleName="alert-setting-modal-content">
          {this.renderTabs()}
          {this.renderTabContent()}
          {this.state.showSpinner ? <Spinner /> : null}
        </ModalContent>

        {this.renderModalFooter()}
      </Modal>
    );
  }
}

AlertSettingModal.propTypes = {
  onClose: PropTypes.func,
  showMyAlertPreference: PropTypes.bool,
  onShowTransientNotificationsChange: PropTypes.func,
  inProductTransientNotificationsEnabled: PropTypes.bool
};

export default cssModules(AlertSettingModal, styles, { allowMultiple: true });
