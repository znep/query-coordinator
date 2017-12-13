import React, { Component } from 'react';
import _ from 'lodash';
import I18n from 'common/i18n';
import CreateAlertModal from 'common/components/CreateAlertModal';

class CreateAlertButton extends Component {

  constructor(props) {
    super(props);

    this.state = {
      showCreateAlertModal: false
    };

    _.bindAll(this,
      'closeModal',
      'renderCreateAlertModal',
      'onCreateAlertButtonClick'
    );
  }


  onCreateAlertButtonClick(event) {
    const showCreateAlertModal = true;

    this.setState({ showCreateAlertModal });
  }

  closeModal() {
    const showCreateAlertModal = false;

    this.setState({ showCreateAlertModal });
  }

  renderCreateAlertModal() {
    const { showCreateAlertModal } = this.state;
    if (showCreateAlertModal) {
      return (
        <CreateAlertModal onClose={this.closeModal} />
      );
    }
  }
  render() {
    const createAlertButtonText = I18n.t('title', { scope:'shared.components.create_alert' });

    return (
      <div>
        <div className="create-alert-button">
          <label
            onClick={(event) => this.onCreateAlertButtonClick(event)}
            className="inline-label manage-prompt-button btn btn-sm btn-default">
            <span className="checkbox-with-icon-label">{createAlertButtonText}</span>
          </label>
        </div>
        {this.renderCreateAlertModal()}
      </div>
    );
  }
}

export default CreateAlertButton;
