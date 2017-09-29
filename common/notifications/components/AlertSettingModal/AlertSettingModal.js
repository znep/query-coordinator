import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import styles from './alert-setting-modal.scss';
import Tabs from './Tabs';
import PreferenceContent from './PreferenceContent';
import cssModules from 'react-css-modules';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import AlertPreferenceStore from '../../store/AlertPreferenceStore'
import Spinner from '../Spinner';

class AlertSettingModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      selectedTab: 'notification',
      preferences: {},
      showSpinner: false
    };
    this.onTabChange = this.onTabChange.bind(this);
    this.onAlertNotificationChange = this.onAlertNotificationChange.bind(this);
    this.saveAlertSettings = this.saveAlertSettings.bind(this);
  }

  componentDidMount() {
    AlertPreferenceStore.get().then((response) => {
      const preferences = response;
      this.setState({preferences});
    });

  }

  onAlertNotificationChange(category, notificationType, subCategoryType) {
    let { preferences } = this.state;
    let categoryData = _.get(preferences, category , {});
    if (categoryData) {
      if (notificationType == 'email') {
        categoryData.enable_email = !categoryData.enable_email
      } else if(notificationType == 'product') {
        categoryData.enable_product_notification = !categoryData.enable_product_notification
      }
      if (!_.isUndefined(subCategoryType)) {
        let subCategoryData = _.get(categoryData, ['sub_categories', subCategoryType], {});
        subCategoryData.enable = !subCategoryData.enable;
        if(_.isUndefined(categoryData.sub_categories)){
          categoryData.sub_categories = {}
        }
        categoryData.sub_categories[subCategoryType] = subCategoryData;
      }
    }
    preferences[category] = categoryData;
    this.setState({preferences});
  }

  onTabChange(selectedTab) {
    this.setState({selectedTab});
  }

  renderNotificationTabContent() {
    const { currentUserRole, isAdmin } = this.props;
    return (
      <PreferenceContent
        currentUserRole={currentUserRole}
        isAdmin={isAdmin}
        onAlertNotificationChange={this.onAlertNotificationChange}
        preferences={this.state.preferences}>
      </PreferenceContent>)
  }

  saveAlertSettings(){
    const { preferences } = this.state;
    const { onClose } = this.props;
    let { showSpinner } = this.state;
    showSpinner = true;
    this.setState({showSpinner});
    AlertPreferenceStore.set(preferences).then(() => {
      showSpinner = false;
      this.setState({showSpinner});
      onClose();
    }).
    catch(() => {
      showSpinner = false;
      this.setState({showSpinner});
    });
  }

  renderTabContent() {
    return this.renderNotificationTabContent();
  }

  render() {
    const { onClose } = this.props;
    const containerStyle = {
      'maxWidth': '80%',
      'padding': '2rem',
    };
    return (
      <Modal styleName="alert-setting-modal" onDismiss={onClose} containerStyle={containerStyle}>
        <ModalHeader title="Settings" onDismiss={onClose}/>
        <ModalContent styleName="alert-setting-modal-content">
          <Tabs onTabChange={this.onTabChange} selectedTab={this.state.selectedTab}/>
          {this.renderTabContent()}
          {this.state.showSpinner ? <Spinner /> : null}
        </ModalContent>
        <ModalFooter>
          <div styleName="cancel-btn" className="cancel-btn" onClick={onClose}>Cancel</div>
          <div styleName="save-btn" className="save-btn" onClick={this.saveAlertSettings}>Save</div>
        </ModalFooter>
      </Modal>
    )
  }
}

AlertSettingModal.propTypes = {
  onClose: PropTypes.func
};

export default cssModules(AlertSettingModal, styles, { allowMultiple: true });
