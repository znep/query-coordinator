import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import styles from './alert-setting-modal.scss';
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
      showSpinner: false,
      userPreferencesLoaded: false,
      failedLoadingUserPreferences: false
    };

    this.onTabChange = this.onTabChange.bind(this);
    this.onAlertNotificationChange = this.onAlertNotificationChange.bind(this);
    this.saveAlertSettings = this.saveAlertSettings.bind(this);
  }

  componentWillMount() {
    let userPreferencesLoaded = false;
    let failedLoadingUserPreferences = false;

    this.setState({ userPreferencesLoaded, failedLoadingUserPreferences });

    AlertPreferenceAPI.get().then((response) => {
      const preferences = response;
      userPreferencesLoaded = true;
      failedLoadingUserPreferences = false;

      this.setState({ preferences, userPreferencesLoaded, failedLoadingUserPreferences });
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

  onTabChange(selectedTab) {
    this.setState({ selectedTab });
  }

  renderNotificationTabContent() { // eslint-disable-line react/sort-comp
    const { userPreferencesLoaded, failedLoadingUserPreferences } = this.state;

    if (userPreferencesLoaded) {
      const { currentUserRole, isSuperAdmin } = this.props;

      return (
        <PreferenceContent
          currentUserRole={currentUserRole}
          isSuperAdmin={isSuperAdmin}
          onAlertNotificationChange={this.onAlertNotificationChange}
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
    const { preferences } = this.state;
    const { onClose } = this.props;
    let { showSpinner } = this.state;
    showSpinner = true;
    this.setState({ showSpinner });
    AlertPreferenceAPI.set(preferences).then(() => {
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
          <div styleName="cancel-button" className="cancel-button" onClick={onClose}>Cancel</div>
          <div styleName="save-button" className="save-button" onClick={this.saveAlertSettings}>Save</div>
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
        <ModalHeader title="Settings" onDismiss={onClose} />

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
  onClose: PropTypes.func
};

export default cssModules(AlertSettingModal, styles, { allowMultiple: true });
