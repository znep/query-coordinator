import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import styles from './index.module.scss';
import Tabs from './Tabs';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';
import CreateAlertApi from './api/CreateAlertApi';
import DeleteView from './DeleteView';
import I18n from 'common/i18n';

class CreateAlertModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      selectedTab: 'advance_alert',
      alertName: '',
      rawSoqlQuery: '',
      isInvalidQuery: false,
      isLoading: false,
      showInfoText: false,
      enableValidationInfo: false,
      showDeleteAlertPage: false
    };

    _.bindAll(this, [
      'onTabChange',
      'onAlertNameChange',
      'onRawSoqlQueryChange',
      'onCreateAlertClick',
      'validateQuery',
      'renderAlertInfo',
      'onDeleteButtonClick',
      'alertParams',
      'renderDeletePage',
      'deleteCancel',
      'deleteSuccess'
    ]);
  }

  componentWillMount() {
    const { alert, editMode, tab } = this.props;
    let { selectedTab, alertName, rawSoqlQuery } = this.state;
    if (editMode) {
      selectedTab = (tab || selectedTab);
      alertName = _.get(alert, 'name');
      rawSoqlQuery = _.get(alert, 'query_string');
    }
    this.setState({ selectedTab, alertName, rawSoqlQuery });
  }

  onTabChange(selectedTab) {
    this.setState({ selectedTab });
  }

  onDeleteButtonClick() {
    this.setState({ showDeleteAlertPage: true });
  }

  onAlertNameChange(event) {
    this.setState({ enableValidationInfo: false });
    this.setState({ alertName: event.target.value });
  }

  onRawSoqlQueryChange(event) {
    this.setState({ enableValidationInfo: false });
    this.setState({ rawSoqlQuery: event.target.value });
  }


  onCreateAlertClick() {
    const { alertName } = this.state;
    const { onClose, editMode, alert } = this.props;
    let alertPromise = null;

    if (editMode) {
      alertPromise = CreateAlertApi.update(this.alertParams(), alert.id);
    } else {
      alertPromise = CreateAlertApi.create(this.alertParams());
    }

    if (_.isEmpty(alertName)) {
      this.setState({ enableValidationInfo: true });
    } else {
      this.setState({ isLoading: true });
      alertPromise.then((response) => {
        this.setState({ isLoading: false });
        onClose();
      }).catch((error) => {
        this.setState({ isLoading: false });
        this.setState({ enableValidationInfo: true });
        this.setState({ isInvalidQuery: true });
      });
    }
  }

  deleteCancel() {
    this.setState({ showDeleteAlertPage: false });
  }

  deleteSuccess() {
    const { onClose } = this.props;
    onClose({ isDeleted: true });
  }


  alertParams() {
    const { alertName, rawSoqlQuery } = this.state;
    const { alert } = this.props;
    let alertParams = { type: 'push' };

    if (_.isEmpty(alert)) {
      alertParams.domain = _.get(window, 'location.host');
      alertParams.dataset_uid = _.get(window, 'sessionData.viewId');
    } else {
      alertParams.domain = _.get(alert, 'domain');
      alertParams.dataset_uid = _.get(alert, 'dataset_uid');
    }
    alertParams['query_string'] = rawSoqlQuery;
    alertParams.name = alertName;
    return alertParams;
  }

  validateQuery() {
    this.setState({ isLoading: true });
    this.setState({ enableValidationInfo: true });
    CreateAlertApi.validate(this.alertParams()).then((response) => {
      if (_.get(response, 'valid', false)) {
        this.setState({ isInvalidQuery: false });
        this.setState({ isLoading: false });
      } else {
        this.setState({ isInvalidQuery: true });
        this.setState({ isLoading: false });
      }
    }).
    catch((error) => {
      this.setState({ isInvalidQuery: true });
      this.setState({ isLoading: false });
      console.log('error');
      console.log(error);
    });
  }

  renderDeletePage() {
    const { showDeleteAlertPage } = this.state;
    const { alert } = this.props;
    if (showDeleteAlertPage) {
      return (
        <DeleteView
          alert={alert}
          onCancel={this.deleteCancel}
          onDeleteSuccess={this.deleteSuccess} />
      );
    }
  }

  renderTabs() {
    const { selectedTab } = this.state;
    return <Tabs onTabChange={this.onTabChange} selectedTab={selectedTab} />;
  }

  renderTabContent() {
    return this.renderAdvanceTabContent();
  }

  renderDeleteButton() {
    const { editMode } = this.props;

    if (editMode) {
      return (
        <button
          styleName="btn btn-error"
          className="delete-button"
          onClick={this.onDeleteButtonClick}>
          {I18n.t('delete', { scope: 'shared.components.create_alert_modal.button' })}
        </button>
      );
    }
  }

  renderAlertInfo() {
    const { enableValidationInfo, isLoading, isInvalidQuery, alertName } = this.state;
    let infoText;
    if (isLoading) {
      infoText = (
        <div styleName="alert-info success-info">
          <span>
            {I18n.t('loading', { scope: 'shared.components.create_alert_modal.info' })}
          </span>
        </div>
      );
    } else if (enableValidationInfo) {
      if (_.isEmpty(alertName)) {
        infoText = (
          <div styleName="alert-info error-info">
            <span>
              {I18n.t('name_error', { scope: 'shared.components.create_alert_modal.info' })}
            </span>
          </div>
        );
      } else if (isInvalidQuery) {
        infoText = (
          <div styleName="alert-info error-info">
            <span styleName="info-icon" className="socrata-icon-close"></span>
            <span>
              {I18n.t('invalid_query', { scope: 'shared.components.create_alert_modal.info' })}
            </span>
          </div>
        );
      } else {
        infoText = (
          <div styleName="alert-info success-info">
            <span styleName="info-icon" className="socrata-icon-check"></span>
            <span>
              {I18n.t('valid_query', { scope: 'shared.components.create_alert_modal.info' })}
            </span>
          </div>
        );
      }
    }
    return infoText;
  }

  renderAdvanceTabContent() {

    const { rawSoqlQuery } = this.state;
    const alertTitle = I18n.t('alert_title', { scope: 'shared.components.create_alert_modal.advance_search' });
    const description = I18n.t('description', { scope: 'shared.components.create_alert_modal.advance_search' });

    return (
      <div styleName="advance-alert-section">
        {this.renderAlertInfo()}
        <div styleName="advance-alert-content">
          <div styleName="advance-alert-title">{alertTitle}</div>
          <div styleName="advance-alert-description">{description}</div>
        </div>

        <div>
          <label styleName="raw-query-title">
            {I18n.t('text_box_description', { scope: 'shared.components.create_alert_modal.advance_search' })}
          </label>
          <textarea
            value={rawSoqlQuery}
            onChange={this.onRawSoqlQueryChange} />
        </div>
      </div>
    );
  }

  renderModalFooter() {
    let { alertName } = this.state;
    return (
      <ModalFooter styleName="footer-section">
        <div styleName="alert-name-section">
          <label>
            {I18n.t('alert_name_label', { scope: 'shared.components.create_alert_modal' })}:
          </label>
          <input
            type="text"
            placeholder={I18n.t('alert_name_placeholder', { scope: 'shared.components.create_alert_modal' })}
            value={alertName}
            onChange={this.onAlertNameChange} />
        </div>
        {this.renderDeleteButton()}
        <button
          styleName="btn btn-default"
          className="validate-button"
          onClick={(event) => this.validateQuery()}>
          {I18n.t('validate', { scope: 'shared.components.create_alert_modal.button' })}
        </button>
        <button
          styleName="btn btn-primary"
          className="create-button"
          onClick={(event) => this.onCreateAlertClick()}>
          {I18n.t('create', { scope: 'shared.components.create_alert_modal.button' })}
        </button>
      </ModalFooter>
    );
  }

  render() {
    const { onClose, editMode } = this.props;
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
      alertModalTitle = I18n.t('edit_mode_title', { scope: 'shared.components.create_alert_modal' });
    } else {
      alertModalTitle = I18n.t('title', { scope: 'shared.components.create_alert_modal' });
    }

    if (showDeleteAlertPage) {
      modalContent = this.renderDeletePage();
    } else {
      modalContent = (
        <div>
          {this.renderTabs()}
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
  onClose: PropTypes.func,
  editMode: PropTypes.bool,
  alert: PropTypes.object
};

export default cssModules(CreateAlertModal, styles, { allowMultiple: true });
