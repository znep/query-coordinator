import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import cssModules from 'react-css-modules';
import styles from './alert-setting-modal.scss';
import OnOffSwitch from './OnOffSwitch';
import I18n from 'common/i18n';

class NotificationSettings extends Component {
  renderTransientNotificationsToggleSwitch() {
    const { onSettingsChange, settings } = this.props;
    const category = 'in_product_transient';
    const categoryData = _.get(settings, category + '[0]', {});

    return (
      <tr className="in-product-transient">
        <td styleName="option-column">
          <div styleName="preference-name">
            {I18n.t(
              'title',
              { scope: 'shared_site_chrome_notifications.alert_setting_modal.in_product_transient' }
            )}
          </div>
          <div styleName="preference-description">
            {I18n.t(
              'description',
              { scope:'shared_site_chrome_notifications.alert_setting_modal.in_product_transient' }
            )}
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
    const { inProductTransientNotificationsEnabled } = this.props;

    if (inProductTransientNotificationsEnabled) {
      const headerText = I18n.t(
        'notification_settings',
        { scope: 'shared_site_chrome_notifications.alert_setting_modal.table_header' }
      );

      return (
        <div>
          <div className="table-wrapper notification-settings" styleName="settings-table">
            <table className="table table-borderless table-condensed table-discrete">
              <thead>
                <tr>
                  <th colSpan="3">
                    <span>{headerText}</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {this.renderTransientNotificationsToggleSwitch()}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  }
}

NotificationSettings.propTypes = {
  settings: PropTypes.object.isRequired,
  onSettingsChange: PropTypes.func,
  inProductTransientNotificationsEnabled: PropTypes.bool
};

export default cssModules(NotificationSettings, styles, { allowMultiple: true });
