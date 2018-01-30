import _ from 'lodash';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';

import CreateAlertApi from './api/CreateAlertApi';
import styles from './index.module.scss';

/**
 DeleteAlert - Confirmation section shown on click of 'delete alert' button. This section renders
 the following buttons:
   'yes'    :  will delete the alert, and on api finish, will call onDeleteSuccess
   'cancel' :  will cancel the delelte operation
*/
class DeleteAlert extends Component {

  onDeleteAlertClick = () => {
    const { alert, onDeleteSuccess } = this.props;
    CreateAlertApi.deleteAlert(alert.id).then((response) => {
      onDeleteSuccess();
    }).catch((error) => {
      console.log(error);
    });
  };

  translationScope = 'shared.components.create_alert_modal.delete_view';

  render() {
    const { onCancel } = this.props;

    return (
      <div styleName="delete-view" className="delete-page">
        <hr />
        <div styleName="title">
          <h4>
            {I18n.t('title', { scope: this.translationScope })}
          </h4>
        </div>
        <div>
          {I18n.t('description', { scope: this.translationScope })}
        </div>
        <div styleName="delete-options">
          <button
            styleName="btn btn-yes"
            className="yes-button"
            onClick={this.onDeleteAlertClick}>
            {I18n.t('button.delete', { scope: this.translationScope })}
          </button>
          <button
            styleName="btn btn-no"
            className="cancel-button"
            onClick={onCancel}>
            {I18n.t('button.cancel', { scope: this.translationScope })}
          </button>
        </div>
      </div>
    );
  }
}

DeleteAlert.propTypes = {
  alert: PropTypes.object.isRequired,
  onCancel: PropTypes.func,
  onDeleteSuccess: PropTypes.func
};

export default cssModules(DeleteAlert, styles, { allowMultiple: true });
