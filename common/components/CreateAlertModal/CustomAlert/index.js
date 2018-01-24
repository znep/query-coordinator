import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import cssModules from 'react-css-modules';
import _ from 'lodash';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';
import Spinner from 'common/components/Spinner';

import styles from './index.module.scss';
import datasetApi from '../api/datasetApi';
import SoqlBuilder from '../components/SoqlBuilder';

/**
 <description>
 @prop customAlert - array of custom alert values
 @prop viewId - dataset id to create custom alert
 @prop onCustomAlertChange - trigger when custom alert values change
 @prop mapboxAccessToken -
 @prop customAlertType - represent custom alert type
 @prop onCustomAlertTypeChange - trigger when custom alert type changes
 @prop customAlertTriggerType - represent alert trigger type
 @prop onTriggerTypeChange - trigger when custom alert trigger type changes
 @prop editMode - enabling edit mode
*/

class CreateCustomAlert extends Component {
  state = {
    customAlert: [{}],
    datasetColumns: [],
    haveNbeView: false,
    isDataLoading: false
  };

  onBreadcrumbClick(pageName) {
    this.props.onCustomAlertPageChange(pageName);
  }

  // updating custom alert values
  onCustomAlertChange = (soqlSlices) => {
    const { onCustomAlertChange } = this.props;

    this.setState({ customAlert: soqlSlices });
    onCustomAlertChange(soqlSlices);
  };

  translationScope = 'shared.components.create_alert_modal.custom_alert';

  renderAlertTypePage() {
    const { customAlertType, onCustomAlertTypeChange } = this.props;
    return (
      <div className="alert-type-page">
        <div styleName="title">
          {I18n.t('title', { scope: this.translationScope })}
        </div>
        <div styleName="description">
          {I18n.t('alert_type_description', { scope: this.translationScope })}
        </div>
        <div>
          <ul styleName="alert-type-options">
            <li className="threshold-option">
              <input
                type="radio"
                id="threshold-option"
                checked={customAlertType === 'entire_data'}
                onChange={() => onCustomAlertTypeChange('entire_data')}
                name="selector" />
              <label htmlFor="threshold-option" styleName="alert-type-title">
                {I18n.t('threshold_title', { scope: this.translationScope })}
              </label>
              <p>
                {I18n.t('threshold_description', { scope: this.translationScope })}
              </p>
              <div styleName="custom-radio-button"></div>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  renderAlertParametersPage() {
    const { customAlert, viewId, mapboxAccessToken } = this.props;

    return (
      <SoqlBuilder
        viewId={viewId}
        mapboxAccessToken={mapboxAccessToken}
        onSoqlChange={this.onCustomAlertChange}
        soqlSlices={customAlert} />
    );
  }

  renderAlertTriggerSelectionPage() {
    const { customAlertTriggerType, onTriggerTypeChange } = this.props;

    return (
      <div className="alert-trigger-page">
        <div styleName="title">
          {I18n.t('title', { scope: this.translationScope })}
        </div>
        <div styleName="description">
          {I18n.t('trigger_page_description', { scope: this.translationScope })}
        </div>
        <div>
          <ul styleName="alert-type-options">
            <li className="rolling-query">
              <input
                type="radio"
                checked={customAlertTriggerType === 'rolling'}
                id="rolling-option"
                onChange={() => onTriggerTypeChange('rolling')}
                name="selector" />
              <label htmlFor="rolling-option" styleName="alert-type-title">
                {I18n.t('rolling_title', { scope: this.translationScope })}
              </label>
              <p>
                {I18n.t('rolling_description', { scope: this.translationScope })}
              </p>
              <div styleName="custom-radio-button"></div>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  renderCustomAlertContent() {
    const { customAlertPage, editMode } = this.props;
    if (customAlertPage === 'alertType' && !editMode) {
      return this.renderAlertTypePage();
    } else if (customAlertPage === 'parameters') {
      return this.renderAlertParametersPage();
    } else if (customAlertPage === 'trigger') {
      return this.renderAlertTriggerSelectionPage();
    }
  }

  renderBreadcrumbs() {
    const { customAlertPage, customAlertType, editMode, enableSaveButton } = this.props;
    let disableParamPage = !editMode && _.isEmpty(customAlertType);
    return (
      <div styleName="breadcrumbs" className="alert-breadcrumbs">
        <ul>
          <li
            styleName={
              classNames({ 'active': customAlertPage === 'alertType', 'disable': editMode })
            }>
            <span onClick={() => (!editMode && this.onBreadcrumbClick('alertType'))}>
              {I18n.t('breadcrumb.alert_type', { scope: this.translationScope })}
            </span>
            <SocrataIcon name="arrow-right" styleName="arrow-icon" />
          </li>
          <li
            styleName={
              classNames({ 'active': customAlertPage === 'parameters', 'disable': disableParamPage })
            }>
            <span onClick={() => (!disableParamPage && this.onBreadcrumbClick('parameters'))}>
              {I18n.t('breadcrumb.parameters', { scope: this.translationScope })}
            </span>
            <SocrataIcon name="arrow-right" styleName="arrow-icon" />
          </li>
          <li
            styleName={
              classNames({ 'active': customAlertPage === 'trigger', 'disable': !enableSaveButton })
            }>
            <span onClick={() => (enableSaveButton && this.onBreadcrumbClick('trigger'))}>
              {I18n.t('breadcrumb.trigger', { scope: this.translationScope })}
            </span>
          </li>
        </ul>
      </div>
    );
  }

  render() {
    const { isDataLoading } = this.state;

    return (
      <div styleName="custom-alert" className="custom-alert">
        {this.renderBreadcrumbs()}
        {isDataLoading ? <Spinner /> : this.renderCustomAlertContent()}
      </div>
    );
  }
}

CreateCustomAlert.defaultProps = {
  customAlertPage: 'alertType',
  editMode: false
};

CreateCustomAlert.propTypes = {
  customAlertPage: PropTypes.string,
  customAlert: PropTypes.array,
  editMode: PropTypes.bool,
  mapboxAccessToken: PropTypes.string.isRequired,
  onAddCustomAlertRow: PropTypes.func,
  onCustomAlertPageChange: PropTypes.func,
  onCustomAlertChange: PropTypes.func,
  viewId: PropTypes.string.isRequired
};

export default cssModules(CreateCustomAlert, styles, { allowMultiple: true });
