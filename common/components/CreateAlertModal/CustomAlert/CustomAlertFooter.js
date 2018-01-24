import _ from 'lodash';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';

import styles from '../index.module.scss';

const BUTTON_STATES = {
  alertType: {
    nextPage: 'parameters',
    previousPage: null,
    showBackButton: false,
    showSaveButton: false,
    showValidateButton: false
  },
  parameters: {
    nextPage: 'trigger',
    previousPage: 'alertType',
    showBackButton: true,
    showNameField: true,
    showSaveButton: false,
    showValidateButton: true
  },
  trigger: {
    nextPage: null,
    previousPage: 'parameters',
    showBackButton: true,
    showNameField: true,
    showSaveButton: true,
    showValidateButton: false
  }
};

/**
  Renders action buttons(save/validate/next/delete) and alert name form field for CustomAlert
  creation/edit. It gets rendered in the modal footer of the CreateAlertModal.
*/
class CustomAlertFooter extends Component {
  state = {
    nextPage: 'parameters',
    previousPage: null,
    showSaveButton: false,
    showDeleteButton: false,
    showBackButton: false,
    showValidateButton: false,
    showNameField: false
  };

  // sometimes props wont change after mounting
  componentWillMount() {
    this.setButtonStates(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.setButtonStates(nextProps);
  }

  setButtonStates = (props) => {
    const { customAlertPage, editMode } = props;
    const nextState = BUTTON_STATES[customAlertPage] || {};

    nextState.showDeleteButton = editMode && customAlertPage === 'trigger';
    this.setState(nextState);
  };

  scope = 'shared.components.create_alert_modal';

  renderAlertNameField() {
    const { alertName, onAlertNameChange } = this.props;
    const { showNameField } = this.state;

    if (showNameField) {
      return (
        <div styleName="alert-name-section">
          <label htmlFor="custom-alert-name-input">
            {I18n.t('alert_name_label', { scope: this.scope })}:
          </label>
          <input
            id="custom-alert-name-input"
            type="text"
            placeholder={I18n.t('alert_name_placeholder', { scope: this.scope })}
            value={alertName}
            onChange={(event) => onAlertNameChange(event)} />
        </div>
      );
    }
  }

  renderDeleteButton() {
    const { showDeleteButton } = this.state;
    const { onDeleteClick } = this.props;

    if (showDeleteButton) {
      return (
        <button
          styleName="btn btn-error"
          className="delete-button"
          onClick={onDeleteClick}>
          {I18n.t('button.delete', { scope: this.scope })}
        </button>
      );
    }
  }

  renderSaveButton() {
    const {
      alertName,
      customAlertPage,
      customAlertType,
      customAlertTriggerType,
      enableSaveButton,
      onPageChange,
      onSaveClick
    } = this.props;
    const { nextPage, showSaveButton } = this.state;
    let disableNextButton = false;

    if (nextPage === 'parameters' && _.isEmpty(customAlertType)) {
      disableNextButton = true;
    } else if ((!enableSaveButton || _.isEmpty(alertName)) && customAlertPage === 'parameters') {
      disableNextButton = true;
    }

    if (showSaveButton) {
      return (
        <button
          styleName="btn btn-primary"
          className="create-button"
          disabled={_.isEmpty(customAlertTriggerType) || _.isEmpty(alertName)}
          onClick={onSaveClick}>
          {I18n.t('button.create', { scope: this.scope })}
        </button>
      );
    } else {
      return (
        <button
          styleName="btn btn-primary"
          className="create-button"
          disabled={disableNextButton}
          onClick={() => onPageChange(nextPage)}>
          {I18n.t('button.next', { scope: this.scope })}
        </button>
      );
    }
  }

  renderBackButton() {
    const { onPageChange } = this.props;
    const { previousPage, showBackButton } = this.state;

    if (showBackButton) {
      return (
        <button
          styleName="btn btn-default"
          className="back-button"
          onClick={() => onPageChange(previousPage)}>
          {I18n.t('button.back', { scope: this.scope })}
        </button>
      );
    }
  }

  renderValidateButton() {
    const { onValidateClick } = this.props;
    const { showValidateButton } = this.state;

    if (showValidateButton) {
      return (
        <button
          styleName="btn btn-default"
          className="validate-button"
          onClick={onValidateClick}>
          {I18n.t('button.validate', { scope: this.scope })}
        </button>
      );
    }
  }

  render() {
    return (
      <div>
        {this.renderAlertNameField()}
        {this.renderDeleteButton()}
        {this.renderBackButton()}
        {this.renderValidateButton()}
        {this.renderSaveButton()}
      </div>
    );
  }
}

CustomAlertFooter.propTypes = {
  alertName: PropTypes.string,
  customAlertPage: PropTypes.string,
  enableSaveButton: PropTypes.bool,
  showNameField: PropTypes.bool,
  onAlertNameChange: PropTypes.func,
  onDeleteClick: PropTypes.func,
  onPageChange: PropTypes.func,
  onSaveClick: PropTypes.func,
  onValidateClick: PropTypes.func
};

export default cssModules(CustomAlertFooter, styles, { allowMultiple: true });
