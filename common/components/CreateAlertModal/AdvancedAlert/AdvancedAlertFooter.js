import _ from 'lodash';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';

import styles from '../index.module.scss';

/**
 Renders delete/save/validate button along with the alert name input box for AdvancedAlert
 creation/edit. It gets rendered in the modal footer of the CreateAlertModal.
*/
class AdvanceAlertFooter extends Component {
  translationScope = 'shared.components.create_alert_modal';

  renderAlertNameInput() {
    const { alertName, onAlertNameChange } = this.props;

    return (
      <div styleName="alert-name-section">
        <label htmlFor="alert-name-input">
          {I18n.t('alert_name_label', { scope: this.translationScope })}:
        </label>
        <input
          id="alert-name-input"
          type="text"
          placeholder={I18n.t('alert_name_placeholder', { scope: this.translationScope })}
          value={alertName}
          onChange={(event) => onAlertNameChange(event)} />
      </div>
    );
  }

  renderDeleteButton() {
    const { onDelete, showDeleteButton } = this.props;

    if (showDeleteButton) {
      return (
        <button
          styleName="btn btn-error"
          className="delete-button"
          onClick={onDelete}>
          {I18n.t('button.delete', { scope: this.translationScope })}
        </button>
      );
    }
  }


  renderSaveButton() {
    const { alertName, enableSaveButton, onSave } = this.props;

    return (
      <button
        styleName="btn btn-primary"
        className="create-button"
        disabled={!enableSaveButton || _.isEmpty(alertName)}
        onClick={onSave}>
        {I18n.t('button.create', { scope: this.translationScope })}
      </button>
    );
  }

  renderValidateButton() {
    return (
      <button
        styleName="btn btn-default"
        className="validate-button"
        onClick={this.props.onValidate}>
        {I18n.t('button.validate', { scope: this.translationScope })}
      </button>
    );
  }

  render() {
    return (
      <div className="advance-alert-footer">
        {this.renderAlertNameInput()}
        {this.renderDeleteButton()}
        {this.renderValidateButton()}
        {this.renderSaveButton()}
      </div>
    );
  }
}

AdvanceAlertFooter.defaultProps = {
  enableSaveButton: false,
  showDeleteButton: false
};


AdvanceAlertFooter.propTypes = {
  alertName: PropTypes.string,
  enableSaveButton: PropTypes.bool,
  showDeleteButton: PropTypes.bool,
  onAlertNameChange: PropTypes.func,
  onDelete: PropTypes.func,
  onSave: PropTypes.func,
  onValidate: PropTypes.func.isRequired
};

export default cssModules(AdvanceAlertFooter, styles, { allowMultiple: true });
