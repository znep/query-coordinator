import _ from 'lodash';
import classNames from 'classnames';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';
import Spinner from 'common/components/Spinner';

import styles from './index.module.scss';
import SoqlBuilder from '../components/SoqlBuilder';

/**
  CustomAlert => Alert created by selecting conditions/groupbys/aggregations using form
  fields (opposite to AdvancedAlert where you give the entire soql query as input).

  CreateCustomAlert has three setps
  1.) AlertType:
      a.) entire-data
      b.) new-rows-only
  2.) Parameters:
      Construct the soql query for triggering the alert using form fields(SoqlBuilder)
  3.) Trigger: (select the trigger type for the alert.)
     PUSH: trigger the alert(send notification/email), as soon as the alert threshold crosses.
       a.) rolling: send alert on every update if threshold exceeds
       b.) one-and-done: send alert once on update and mute
     PERIODICAL:
       a.) periodic: check and trigger the alert on a duration basis (daily|weekly|monthly)
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
    const disableParamPage = !editMode && _.isEmpty(customAlertType);

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
  viewId: PropTypes.string.isRequired,
  onAddCustomAlertRow: PropTypes.func,
  onCustomAlertChange: PropTypes.func,
  onCustomAlertPageChange: PropTypes.func
};

export default cssModules(CreateCustomAlert, styles, { allowMultiple: true });
