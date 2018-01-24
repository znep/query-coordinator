import _ from 'lodash';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';

import CreateAlertApi from './api/CreateAlertApi';
import styles from './index.module.scss';

class DeleteAlert extends Component {
  constructor() {
    super();

    _.bindAll(this,
      'deleteAlert'
    );
  }

  deleteAlert() {
    const { alert, onDeleteSuccess } = this.props;

    CreateAlertApi.delete(alert.id).then((response) => {
      onDeleteSuccess();
    }).catch((error) => {
      console.log(error);
    });
  }

  render() {
    const { onCancel } = this.props;
    const translationScope = 'shared.components.create_alert_modal.delete_view';
    return (
      <div styleName="delete-view" className="delete-page">
        <hr />
        <div styleName="title">
          <h4>
            {I18n.t('title', { scope: translationScope })}
          </h4>
        </div>
        <div>
            {I18n.t('description', { scope: translationScope })}
        </div>
        <div styleName="delete-options">
          <button
            styleName="btn btn-yes"
            className="yes-button"
            onClick={this.deleteAlert}>
            {I18n.t('button.delete', { scope: translationScope })}
          </button>
          <button
            styleName="btn btn-no"
            className="cancel-button"
            onClick={onCancel}>
            {I18n.t('button.cancel', { scope: translationScope })}
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
