import classNames from 'classnames';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';

import I18n from 'common/i18n';

import styles from './index.module.scss';

/**
 <description>
 @prop alertName - alert name
 @prop enableValidationInfo - boolean to enable alert info
 @prop isLoading - boolean to show loding info
 @prop isInvalidQuery - boolean to show invalid qurey info
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
        <div styleName="alert-info error-info" className="invaild-query">
          <span styleName="info-icon" className="socrata-icon-close" />
          {I18n.t('invalid_query', { scope: this.translationScope })}
        </div>
      );
    }

    return (
      <div styleName="alert-info success-info" className="vaild-query">
        <span styleName="info-icon" className="socrata-icon-check" />
        {I18n.t('valid_query', { scope: this.translationScope })}
      </div>
    );
  }

  translationScope = 'shared.components.create_alert_modal.info';

  render() {
    const { isLoading, enableValidationInfo } = this.props;

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
  isLoading: PropTypes.bool,
  isInvalidQuery: PropTypes.bool
};

export default cssModules(AlertInfo, styles, { allowMultiple: true });
