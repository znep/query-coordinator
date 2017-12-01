import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import cssModules from 'react-css-modules';
import styles from './alert-setting-modal.scss';
import classNames from 'classnames';
import OnOffSwitch from './OnOffSwitch';
import I18n from 'common/i18n';

class EmailSettings extends Component {

  renderEmailDigest() {
    const { onSettingsChange, settings } = this.props;
    const category = 'email_digest';
    const categoryData = _.get(settings, category + '[0]', {});
    categoryData.value = categoryData.value || 'real_time';
    return (
      <tr className="email-digest-option">
        <td styleName="option-column">
          <div styleName="preference-name">
            {I18n.t('title', { scope: 'shared_site_chrome_notifications.alert_setting_modal.email_digest' })}
          </div>
          <div styleName="preference-description">
            {I18n.t('description', { scope:'shared_site_chrome_notifications.alert_setting_modal.email_digest' })}
          </div>
        </td>

        <td>
          <OnOffSwitch
            enableSwitch={categoryData.enable}
            onSwitchChange={() => onSettingsChange(category, { enable: !categoryData.enable })} />
        </td>

        <td>
          <div styleName="button-groups" className="modal-button-group r-to-l">
            <button
              styleName={classNames({ 'selected': categoryData.value == 'real_time' })}
              onClick={() => onSettingsChange(category, { value: 'real_time' })}
              type="button">
              {I18n.t('real_time', { scope:'shared_site_chrome_notifications.alert_setting_modal.email_digest' })}
            </button>
            <button
              styleName={classNames({ 'selected': categoryData.value == 'hourly' })}
              onClick={() => onSettingsChange(category, { value: 'hourly' })}
              type="button">
              {I18n.t('hourly', { scope:'shared_site_chrome_notifications.alert_setting_modal.email_digest' })}
            </button>
            <button
              styleName={classNames({ 'selected': categoryData.value == 'daily' })}
              onClick={() => onSettingsChange(category, { value: 'daily' })}
              type="button">
              {I18n.t('daily', { scope:'shared_site_chrome_notifications.alert_setting_modal.email_digest' })}
            </button>
            <button
              styleName={classNames({ 'selected': categoryData.value == 'weekly' })}
              onClick={() => onSettingsChange(category, { value: 'weekly' })}
              type="button">
              {I18n.t('weekly', { scope:'shared_site_chrome_notifications.alert_setting_modal.email_digest' })}
            </button>
            <button
              styleName={classNames({ 'selected': categoryData.value == 'monthly' })}
              onClick={() => onSettingsChange(category, { value: 'monthly' })}
              type="button">
              {I18n.t('monthly', { scope:'shared_site_chrome_notifications.alert_setting_modal.email_digest' })}
            </button>
          </div>
        </td>
      </tr>
    );
  }

  renderEmailMuteButton() {
    const { onSettingsChange, settings } = this.props;
    const category = 'email_mute';
    const categoryData = _.get(settings, category + '[0]', {});
    return (
      <tr className="email-mute">
        <td>
          <div styleName="preference-name">
            {I18n.t('title', { scope: 'shared_site_chrome_notifications.alert_setting_modal.email_mute' })}
          </div>
          <div styleName="preference-description">
            {I18n.t('description', { scope:'shared_site_chrome_notifications.alert_setting_modal.email_mute' })}
          </div>
        </td>

        <td colSpan="2">
          <OnOffSwitch
            enableSwitch={categoryData.enable}
            onSwitchChange={() => onSettingsChange(category, { enable: !categoryData.enable })} />
        </td>

      </tr>
    );
  }

  render() {
    return (
      <div>
        <div className="table-wrapper email-settings" styleName="settings-table">
          <table className="table table-borderless table-condensed table-discrete">
            <thead>
              <tr>
                <th colSpan="3">
                  <span>
                    {I18n.t('email_settings',
                      { scope:'shared_site_chrome_notifications.alert_setting_modal.table_header' })}
                  </span>
                </th>

              </tr>
            </thead>
            <tbody>
            {this.renderEmailDigest()}
            {this.renderEmailMuteButton()}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

EmailSettings.propTypes = {
  settings: PropTypes.object.isRequired,
  onSettingsChange: PropTypes.func
};

export default cssModules(EmailSettings, styles, { allowMultiple: true });
