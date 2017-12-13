import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Tabs from './Tabs';
import classNames from 'classnames';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';
import CreateAlertApi from './api/CreateAlertApi';

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
      enableValidationInfo: false
    };

    _.bindAll(this, [
      'onTabChange',
      'onAlertNameChange',
      'onRawSoqlQueryChange',
      'onCreateAlertClick',
      'validateQuery',
      'renderAlertInfo'
    ]);
  }

  onTabChange(selectedTab) {
    this.setState({ selectedTab });
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
    const { alertName, rawSoqlQuery } = this.state;
    const { onClose } = this.props;
    let alertParams = { type: 'push' };
    alertParams['query_string'] = rawSoqlQuery;
    alertParams.name = alertName;
    if (_.isEmpty(alertName)) {
      this.setState({ enableValidationInfo: true });
    } else {
      this.setState({ isLoading: true });
      CreateAlertApi.create(alertParams).then((response) => {
        this.setState({ isLoading: false });
        onClose();
      }).catch((error) => {
        this.setState({ isLoading: false });
        this.setState({ enableValidationInfo: true });
        this.setState({ isInvalidQuery: true });
      });
    }
  }

  validateQuery() {
    const { alertName, rawSoqlQuery } = this.state;
    let alertParams = {};
    alertParams['query_string'] = rawSoqlQuery;
    alertParams.name = alertName;
    this.setState({ isLoading: true });
    this.setState({ enableValidationInfo: true });
    CreateAlertApi.validate(alertParams).then((response) => {
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

  renderTabs() {
    const { selectedTab } = this.state;
    return <Tabs onTabChange={this.onTabChange} selectedTab={selectedTab} />;
  }

  renderTabContent() {
    return this.renderAdvanceTabContent();
  }

  renderAlertInfo() {
    const { enableValidationInfo, isLoading, isInvalidQuery, alertName } = this.state;
    let infoText;
    if (isLoading) {
      infoText = (
        <div className="alert-info success-info">
          <span>
            {I18n.t('loading', { scope: 'shared.components.create_alert_modal.info' })}
          </span>
        </div>
      );
    } else if (enableValidationInfo) {
      if (_.isEmpty(alertName)) {
        infoText = (
          <div className="alert-info error-info">
            <span>
              {I18n.t('name_error', { scope: 'shared.components.create_alert_modal.info' })}
            </span>
          </div>
        );
      } else if (isInvalidQuery) {
        infoText = (
          <div className="alert-info error-info">
            <span className="info-icon socrata-icon-close"></span>
            <span>
              {I18n.t('invalid_query', { scope: 'shared.components.create_alert_modal.info' })}
            </span>
          </div>
        );
      } else {
        infoText = (
          <div className="alert-info success-info">
            <span className="info-icon socrata-icon-check"></span>
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
      <div className="advance-alert-section">
        {this.renderAlertInfo()}
        <div className="advance-alert-content">
          <div className="advance-alert-title">{alertTitle}</div>
          <div className="advance-alert-description">{description}</div>
        </div>

        <div>
          <label className="raw-query-title">
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
      <ModalFooter>
        <div className="alert-name-section">
          <label>
            {I18n.t('alert_name_label', { scope: 'shared.components.create_alert_modal' })}:
          </label>
          <input
            type="text"
            placeholder={I18n.t('alert_name_placeholder', { scope: 'shared.components.create_alert_modal' })}
            value={alertName}
            onChange={this.onAlertNameChange} />
        </div>
        <button
          className="validate-button btn btn-default"
          onClick={(event) => this.validateQuery()}>
          {I18n.t('validate', { scope: 'shared.components.create_alert_modal.button' })}
        </button>
        <button
          className="create-button btn btn-primary"
          onClick={(event) => this.onCreateAlertClick()}>
          {I18n.t('create', { scope: 'shared.components.create_alert_modal.button' })}
        </button>
      </ModalFooter>
    );
  }

  render() {
    const { onClose } = this.props;
    const containerStyle = {
      'maxWidth': '800px',
      'maxHeight': 'calc(100vh - 40px)',
      'padding': '20px',
      'margin': '40px auto',
      'bottom': 'auto',
      'overflow': 'auto',
      'font-size': '12px'
    };

    return (
      <div className="create-alert-modal">
        <Modal onDismiss={onClose} containerStyle={containerStyle}>
          <ModalHeader
            title={I18n.t('title', { scope: 'shared.components.create_alert_modal' })}
            onDismiss={onClose} />

          <ModalContent styleName="alert-setting-modal-content">
            {this.renderTabs()}
            {this.renderTabContent()}
          </ModalContent>

          {this.renderModalFooter()}
        </Modal>
      </div>
    );
  }
}

CreateAlertModal.propTypes = {
  onClose: PropTypes.func
};

export default CreateAlertModal;
