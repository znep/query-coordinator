import React, { Component } from 'react';
import I18n from 'common/i18n';

class CreateAlertButton extends Component {

  render() {
    const createAlertButtonText = I18n.t('title', { scope: 'shared.components.create_alert' });

    return (
      <div className="create-alert-button">
        <label
          className="inline-label manage-prompt-button btn btn-sm btn-default">
          <span className="checkbox-with-icon-label">{createAlertButtonText}</span>
        </label>
      </div>
    );
  }
}

export default CreateAlertButton;
