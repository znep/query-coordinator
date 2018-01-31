import _ from 'lodash';
import classNames from 'classnames';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';

import SocrataIcon from 'common/components/SocrataIcon';
import styles from './index.module.scss';

/**
 For alert's create/edit operations, renders
   - form-data-loading spinner.
   - validation messages.
*/
class AlertInfo extends Component {

  validationMessage() {
    const { alertName, enableValidationInfo, isInvalidQuery } = this.props;

    if (_.isEmpty(alertName)) {
      return (
        <div styleName="alert-info error-info" className="name-error">
          {I18n.t('name_error', { scope: this.translationScope })}
        </div>
      );
    } else if (isInvalidQuery) {
      return (
        <div styleName="alert-info error-info" className="invalid-query">
          <SocrataIcon name="close" styleName="info-icon" />
          {I18n.t('invalid_query', { scope: this.translationScope })}
        </div>
      );
    }

    return (
      <div styleName="alert-info success-info" className="valid-query">
        <SocrataIcon name="check" styleName="info-icon" />
        {I18n.t('valid_query', { scope: this.translationScope })}
      </div>
    );
  }

  translationScope = 'shared.components.create_alert_modal.info';

  render() {
    const { enableValidationInfo, isLoading } = this.props;

    if (isLoading) {
      return (
        <div styleName="alert-info success-info" className="loading-message">
          {I18n.t('loading', { scope: this.translationScope })}
        </div>
      );
    } else if (enableValidationInfo) {
      return this.validationMessage();
    }
  }
}

AlertInfo.propTypes = {
  alertName: PropTypes.string,
  enableValidationInfo: PropTypes.bool,
  isInvalidQuery: PropTypes.bool,
  isLoading: PropTypes.bool
};

export default cssModules(AlertInfo, styles, { allowMultiple: true });
