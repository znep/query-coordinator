import _ from 'lodash';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';

import AdvancedAlert from './AdvancedAlert';
import AdvancedAlertFooter from './AdvancedAlert/AdvancedAlertFooter';
import AlertInfo from './AlertInfo';
import CreateCustomAlert from './CustomAlert';
import CustomAlertFooter from './CustomAlert/CustomAlertFooter';
import CreateAlertApi from './api/CreateAlertApi';
import DeleteAlert from './DeleteAlert';
import styles from './index.module.scss';
import Tabs from './components/Tabs';

/**
 <description>
 @prop alert - object represent the alert
 @prop editAlertType - represent the alert type
 @prop editMode - boolean to enable edit mode
 @props mapboxAccessToken - mapbox access token
 @pops onClose - trigger when modal close
*/

class CreateAlertModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      alertName: '',
      customAlert: [],
      customAlertType: '',
      customAlertTriggerType: '',
      currentCustomAlertPage: 'alertType',
      enableSaveButton: false,
      enableValidationInfo: false,
      isInvalidQuery: false,
      isLoading: false,
      mapboxAccessToken: '',
      rawSoqlQuery: '',
      selectedTab: 'customAlert',
      showInfoText: false,
      showDeleteAlertPage: false,
      viewId: ''
    };

    _.bindAll(this, [
      'onTabChange',
      'onAlertNameChange',
      'onRawSoqlQueryChange',
      'onCreateAlertClick',
      'onCustomAlertPageChange',
      'onValidateAlert',
      'renderAlertInfo',
      'onDeleteButtonClick',
      'getAlertParams',
      'renderDeletePage',
      'deleteCancel',
      'deleteSuccess'
    ]);
  }

  componentWillMount() {
    const { alert, editAlertType, editMode } = this.props;
    let {
      alertName,
      customAlertTriggerType,
      customAlert,
      currentCustomAlertPage,
      mapboxAccessToken,
      rawSoqlQuery,
      selectedTab,
      viewId
    } = this.state;

    if (editMode) {
      // setting alert value in edit mode
      selectedTab = (editAlertType === 'abstract' ? 'customAlert' : 'advancedAlert');
      alertName = _.get(alert, 'name');
      rawSoqlQuery = _.get(alert, 'query_string');
      viewId = _.get(alert, 'dataset_uid');
      mapboxAccessToken = _.get(this.props, 'mapboxAccessToken');
      customAlert = _.get(alert, 'abstract_params', []);
      customAlertTriggerType = (_.get(alert, 'changes_on') === 'entire_data' ? 'rolling' : '');
      currentCustomAlertPage = 'parameters';
    } else {
      // using sessionData view id in create alert mode
      viewId = _.get(window, 'sessionData.viewId');
      mapboxAccessToken = _.get(window, 'serverConfig.mapboxAccessToken');
    }

    this.setState({
      alertName,
      customAlert,
      customAlertTriggerType,
      currentCustomAlertPage,
      mapboxAccessToken,
      rawSoqlQuery,
      selectedTab,
      viewId
    });
  }

  onTabChange(selectedTab) {
    this.setState({ enableValidationInfo: false, enableSaveButton: false, selectedTab });
  }

  onCustomAlertTypeChange = (type) => {
    this.setState({ customAlertType: type });
  }

  onTriggerTypeChange = (triggerType) => {
    this.setState({ customAlertTriggerType: triggerType });
  }

  onDeleteButtonClick() {
    this.setState({ showDeleteAlertPage: true });
  }

  onAlertNameChange(event) {
    this.setState({
      alertName: event.target.value,
      enableSaveButton: false,
      enableValidationInfo: false
    });
  }

  onRawSoqlQueryChange(event) {
    this.setState({
      enableSaveButton: false,
      enableValidationInfo: false,
      rawSoqlQuery: event.target.value
    });
  }


  onCreateAlertClick() {
    const { alertName, selectedTab } = this.state;
    const { alert, editMode, onClose } = this.props;
    let alertPromise = null;

    if (editMode) {
      alertPromise = CreateAlertApi.update(this.getAlertParams(), alert.id);
    } else {
      alertPromise = CreateAlertApi.create(this.getAlertParams());
    }

    if (_.isEmpty(alertName)) {
      this.setState({ enableValidationInfo: true });
    } else {
      this.setState({ isLoading: true });
      alertPromise.then((response) => {
        this.setState({ isLoading: false });
        onClose();
      }).catch((error) => {
        this.setState({ enableValidationInfo: true, isLoading: false, isInvalidQuery: true });
      });
    }
  }

  onCustomAlertPageChange(page) { // eslint-disable-line react/sort-comp
    this.setState({ currentCustomAlertPage: page, enableValidationInfo: false });
  }

  onValidateAlert() {
    const { selectedTab } = this.state;
    const params = this.getAlertParams();
    let promise;

    this.setState({ enableValidationInfo: true, isLoading: true });

    if (selectedTab === 'customAlert') {
      promise = CreateAlertApi.validateCustomAlert(params);
    } else {
      promise = CreateAlertApi.validate(params);
    }
    promise.then((response) => {
      if (_.get(response, 'valid', false)) {
        this.setState({ isInvalidQuery: false, enableSaveButton: true, isLoading: false });
      } else {
        this.setState({ isInvalidQuery: true, isLoading: false, enableSaveButton: false });
      }
    }).
    catch((error) => {
      this.setState({ isInvalidQuery: true, isLoading: false, enableSaveButton: false });
      console.log(error);
    });
  }

  onCustomAlertChange = (customAlert) => {
    this.setState({
      customAlert: customAlert,
      enableSaveButton: false,
      enableValidationInfo: false
    });
  }

  getAlertParams() { // eslint-disable-line react/sort-comp
    const { alertName, customAlert, rawSoqlQuery, selectedTab } = this.state;
    const { alert } = this.props;
    const alertParams = { type: 'push' };

    // params will be changed based on alert type
    if (_.isEmpty(alert)) {
      alertParams.domain = _.get(window, 'location.host');
      alertParams.dataset_uid = _.get(window, 'sessionData.viewId');
    } else {
      alertParams.domain = _.get(alert, 'domain');
      alertParams.dataset_uid = _.get(alert, 'dataset_uid');
    }
    if (selectedTab === 'customAlert') {
      alertParams.watch_on = 'data';
      alertParams.changes_on = 'entire_data';
      alertParams.query_type = 'abstract';
      alertParams.abstract_params = customAlert.map(alert => _.omitBy(alert, _.isNil));
    } else {
      alertParams.query_string = rawSoqlQuery;
      alertParams.query_type = 'raw';
    }

    alertParams.name = alertName;
    return alertParams;
  }

  deleteCancel() {
    this.setState({ showDeleteAlertPage: false });
  }

  deleteSuccess() {
    this.props.onClose({ isDeleted: true });
  }

  translationScope = 'shared.components.create_alert_modal';

  renderTabs() {
    const { selectedTab } = this.state;
    const { editMode } = this.props;
    return <Tabs onTabChange={this.onTabChange} selectedTab={selectedTab} editMode={editMode} />;
  }

  renderTabContent() {
    const {
      customAlertType,
      customAlertTriggerType,
      customAlert,
      currentCustomAlertPage,
      enableSaveButton,
      mapboxAccessToken,
      selectedTab,
      viewId,
      rawSoqlQuery
    } = this.state;
    const { editMode } = this.props;

    if (selectedTab === 'customAlert') {
      return (
        <CreateCustomAlert
          viewId={viewId}
          mapboxAccessToken={mapboxAccessToken}
          editMode={editMode}
          enableSaveButton={enableSaveButton}
          customAlert={customAlert}
          onCustomAlertTypeChange={this.onCustomAlertTypeChange}
          customAlertType={customAlertType}
          onTriggerTypeChange={this.onTriggerTypeChange}
          customAlertTriggerType={customAlertTriggerType}
          onAlertPageOptionChange={this.onAlertPageOptionChange}
          onCustomAlertPageChange={this.onCustomAlertPageChange}
          onCustomAlertChange={this.onCustomAlertChange}
          customAlertPage={currentCustomAlertPage} />

      );
    } else if (selectedTab === 'advancedAlert') {
      return (
        <AdvancedAlert
          onRawSoqlQueryChange={this.onRawSoqlQueryChange}
          rawSoqlQuery={rawSoqlQuery} />
      );
    }
  }

  renderDeletePage() {
    const { showDeleteAlertPage } = this.state;
    const { alert } = this.props;
    if (showDeleteAlertPage) {
      return (
        <DeleteAlert
          alert={alert}
          onCancel={this.deleteCancel}
          onDeleteSuccess={this.deleteSuccess} />
      );
    }
  }

  renderAlertInfo() {
    const { alertName, enableValidationInfo, isLoading, isInvalidQuery } = this.state;
    return (
      <AlertInfo
        alertName={alertName}
        enableValidationInfo={enableValidationInfo}
        isLoading={isLoading}
        isInvalidQuery={isInvalidQuery} />
    );
  }

  renderModalFooter() {
    const { editMode } = this.props;
    const {
      alertName,
      customAlertType,
      customAlertTriggerType,
      currentCustomAlertPage,
      enableSaveButton,
      selectedTab
    } = this.state;
    let footerContent = null;

    if (selectedTab === 'customAlert') {
      footerContent = (
        <CustomAlertFooter
          alertName={alertName}
          customAlertType={customAlertType}
          enableSaveButton={enableSaveButton}
          onAlertNameChange={this.onAlertNameChange}
          onSaveClick={this.onCreateAlertClick}
          onValidateClick={this.onValidateAlert}
          onPageChange={this.onCustomAlertPageChange}
          onDeleteClick={this.onDeleteButtonClick}
          customAlertTriggerType={customAlertTriggerType}
          editMode={editMode}
          customAlertPage={currentCustomAlertPage} />
      );
    } else {
      footerContent = (
        <AdvancedAlertFooter
          alertName={alertName}
          enableSaveButton={enableSaveButton}
          onAlertNameChange={this.onAlertNameChange}
          showDeleteButton={editMode}
          onValidate={this.onValidateAlert}
          onSave={this.onCreateAlertClick}
          onDelete={this.onDeleteButtonClick} />
      );
    }
    return (
      <ModalFooter styleName="footer-section">
        {footerContent}
      </ModalFooter>
    );
  }

  render() {
    const { editMode, onClose } = this.props;
    const { showDeleteAlertPage } = this.state;
    const containerStyle = {
      'maxWidth': '800px',
      'maxHeight': 'calc(100vh - 40px)',
      'padding': '20px',
      'margin': '40px auto',
      'bottom': 'auto',
      'overflow': ' auto',
      'minHeight': '400px'
    };
    let alertModalTitle;
    let modalContent;

    if (editMode) {
      alertModalTitle = I18n.t('edit_mode_title', { scope: this.translationScope });
    } else {
      alertModalTitle = I18n.t('title', { scope: this.translationScope });
    }

    if (showDeleteAlertPage) {
      modalContent = this.renderDeletePage();
    } else {
      modalContent = (
        <div>
          {this.renderTabs()}
          {this.renderAlertInfo()}
          {this.renderTabContent()}
        </div>
      );
    }

    return (
      <div styleName="create-alert-modal" className="create-alert-modal-container">
        <Modal onDismiss={onClose} containerStyle={containerStyle}>
          <ModalHeader
            title={alertModalTitle}
            onDismiss={onClose} />

          <ModalContent>
            {modalContent}
          </ModalContent>

          {showDeleteAlertPage ? null : this.renderModalFooter()}
        </Modal>
      </div>
    );
  }
}

CreateAlertModal.defaultProps = {
  alert: {},
  editMode: false
};

CreateAlertModal.propTypes = {
  alert: PropTypes.object,
  editAlertType: PropTypes.string,
  editMode: PropTypes.bool,
  onClose: PropTypes.func.isRequired
};

export default cssModules(CreateAlertModal, styles, { allowMultiple: true });
