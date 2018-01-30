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
  CreateAlertModal - Surface to create alerts
  Alerts types:
     Custom alert   - Alert created using the Soql builder
     Advanced alert - Alert created by typing the raw soql query

 @prop alert              - Alert object with alert params. (to be saved/got from the 'notifications
                            and alerts' service. We use camel case for all the keys in the object to
                            meet notifications and alert service's api.)
 @prop editAlertType      - 'custom'|'abstract'
 @prop editMode           - enable or disable edit mode (in edit mode, we show delete button and ...)
 @props mapboxAccessToken - mapbox access token used for geocode search
 @pops onClose            - called when the modal is closed
*/
class CreateAlertModal extends Component {

  state = {
    alertName: '',
    currentCustomAlertPage: 'alertType',
    customAlert: [],
    customAlertTriggerType: '',
    customAlertType: '',
    enableSaveButton: false,
    enableValidationInfo: false,
    isInvalidQuery: false,
    isLoading: false,
    mapboxAccessToken: '',
    rawSoqlQuery: '',
    selectedTab: 'customAlert',
    showDeleteAlertPage: false,
    showInfoText: false,
    viewId: ''
  };

  componentWillMount() {
    const { alert, editAlertType, editMode } = this.props;
    let {
      alertName,
      currentCustomAlertPage,
      customAlert,
      customAlertTriggerType,
      mapboxAccessToken,
      rawSoqlQuery,
      selectedTab,
      viewId
    } = this.state;

    if (editMode) {
      // setting alert value in edit mode
      selectedTab = (editAlertType === 'abstract' ? 'customAlert' : 'advancedAlert');
      alertName = _.get(alert, 'name');
      mapboxAccessToken = _.get(this.props, 'mapboxAccessToken');
      rawSoqlQuery = _.get(alert, 'query_string');
      viewId = _.get(alert, 'dataset_uid');
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

  onTabChange = (selectedTab) => {
    this.setState({ enableValidationInfo: false, enableSaveButton: false, selectedTab });
  }

  onCustomAlertTypeChange = (type) => {
    this.setState({ customAlertType: type });
  }

  onTriggerTypeChange = (triggerType) => {
    this.setState({ customAlertTriggerType: triggerType });
  }

  onDeleteButtonClick = () => {
    this.setState({ showDeleteAlertPage: true });
  }

  onAlertNameChange = (event) => {
    this.setState({
      alertName: event.target.value,
      enableSaveButton: false,
      enableValidationInfo: false
    });
  }

  onRawSoqlQueryChange = (event) => {
    this.setState({
      enableSaveButton: false,
      enableValidationInfo: false,
      rawSoqlQuery: event.target.value
    });
  }


  onCreateAlertClick = () => {
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

  onCustomAlertPageChange = (page) => {
    this.setState({ currentCustomAlertPage: page, enableValidationInfo: false });
  }

  onValidateAlert = () => {
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

  getAlertParams = () => {
    const { alertName, customAlert, rawSoqlQuery, selectedTab } = this.state;
    const { alert } = this.props;
    const alertParams = { type: 'push' };

    // params will be changed based on alert type
    if (_.isEmpty(alert)) {
      alertParams.domain = window.location.host;
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

  deleteCancel = () => {
    this.setState({ showDeleteAlertPage: false });
  }

  deleteSuccess = () => {
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
      currentCustomAlertPage,
      customAlertType,
      customAlertTriggerType,
      customAlert,
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
          customAlert={customAlert}
          customAlertPage={currentCustomAlertPage}
          customAlertTriggerType={customAlertTriggerType}
          customAlertType={customAlertType}
          editMode={editMode}
          enableSaveButton={enableSaveButton}
          mapboxAccessToken={mapboxAccessToken}
          viewId={viewId}
          onAlertPageOptionChange={this.onAlertPageOptionChange}
          onCustomAlertChange={this.onCustomAlertChange}
          onCustomAlertPageChange={this.onCustomAlertPageChange}
          onCustomAlertTypeChange={this.onCustomAlertTypeChange}
          onTriggerTypeChange={this.onTriggerTypeChange} />
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
    const { alertName, enableValidationInfo, isInvalidQuery, isLoading } = this.state;
    return (
      <AlertInfo
        alertName={alertName}
        enableValidationInfo={enableValidationInfo}
        isInvalidQuery={isInvalidQuery}
        isLoading={isLoading} />
    );
  }
  
  renderAdvanceTabContent() {

    const { rawSoqlQuery } = this.state;
    const alertTitle = I18n.t('alert_title', { scope: 'shared.components.create_alert_modal.advanced_search' });
    const description = I18n.t('description', { scope: 'shared.components.create_alert_modal.advanced_search' });

    return (
      <div styleName="advance-alert-section">
        {this.renderAlertInfo()}
        <div styleName="advance-alert-content">
          <div styleName="advance-alert-title">{alertTitle}</div>
          <div styleName="advance-alert-description">{description}</div>
        </div>

        <div>
          <label styleName="raw-query-title">
            {I18n.t('text_box_description', { scope: 'shared.components.create_alert_modal.advanced_search' })}
          </label>
          <textarea
            value={rawSoqlQuery}
            onChange={this.onRawSoqlQueryChange} />
        </div>
      </div>
    );
  }

  renderModalFooter() {
    const { editMode } = this.props;
    const {
      alertName,
      currentCustomAlertPage,
      customAlertType,
      customAlertTriggerType,
      enableSaveButton,
      selectedTab
    } = this.state;
    let footerContent = null;

    if (selectedTab === 'customAlert') {
      footerContent = (
        <CustomAlertFooter
          alertName={alertName}
          customAlertPage={currentCustomAlertPage}
          customAlertTriggerType={customAlertTriggerType}
          customAlertType={customAlertType}
          editMode={editMode}
          enableSaveButton={enableSaveButton}
          onAlertNameChange={this.onAlertNameChange}
          onDeleteClick={this.onDeleteButtonClick}
          onPageChange={this.onCustomAlertPageChange}
          onSaveClick={this.onCreateAlertClick}
          onValidateClick={this.onValidateAlert} />
      );
    } else {
      footerContent = (
        <AdvancedAlertFooter
          alertName={alertName}
          enableSaveButton={enableSaveButton}
          showDeleteButton={editMode}
          onAlertNameChange={this.onAlertNameChange}
          onDelete={this.onDeleteButtonClick}
          onSave={this.onCreateAlertClick}
          onValidate={this.onValidateAlert} />
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
  alert: PropTypes.shape({
    abstract_params: PropTypes.array,
    changes_on: PropTypes.string,
    dataset_uid: PropTypes.string,
    name: PropTypes.string,
    query_string: PropTypes.string
  }),
  editAlertType: PropTypes.string,
  editMode: PropTypes.bool,
  onClose: PropTypes.func.isRequired
};

export default cssModules(CreateAlertModal, styles, { allowMultiple: true });
