import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import cssModules from 'react-css-modules';
import styles from './alert-setting-modal.scss';
import OnOffSwitch from './OnOffSwitch';
import I18n from 'common/i18n';
import EmailSettings from './EmailSettings';
import NotificationSettings from './NotificationSettings';

class PreferenceContent extends Component {
  renderAllAssets() {
    const {
      onAlertNotificationChange,
      preferences,
      currentUserRole,
      isSuperAdmin
    } = this.props;
    const category = 'all_assets';
    const categoryData = _.get(preferences, category, {});
    const subCategoryData = _.get(categoryData, 'sub_categories', {});
    let collaboratorsTag = null;

    if (!_.isEmpty(currentUserRole) || isSuperAdmin) {
      const collaboratorsKey = 'collaborators_changes';
      collaboratorsTag = (
        <label className="inline-label" styleName="email-option" htmlFor="collaborators-changes">
          <input
            checked={_.get(subCategoryData, [collaboratorsKey, 'enable'], false)}
            onChange={() => onAlertNotificationChange(category, null, collaboratorsKey)}
            id="collaborators-changes"
            type="checkbox" />
          <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.all_assets.collaborators_change')}</span>
        </label>
      );
    }

    return (
      <tr>
        <td>
          <div styleName="preference-name">
            {I18n.t('shared_site_chrome_notifications.alert_setting_modal.all_assets.title')}
          </div>
          <div styleName="preference-description">
            {I18n.t('shared_site_chrome_notifications.alert_setting_modal.all_assets.description')}
          </div>

          <div styleName="preference-types">
            <label className="inline-label" styleName="email-option" htmlFor="meta-data-change">
              <input
                id="meta-data-change"
                type="checkbox"
                checked={_.get(subCategoryData, ['meta_data_change', 'enable'], false)}
                onChange={(event) => onAlertNotificationChange(category, null, 'meta_data_change')} />
              <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.all_assets.meta_data_change')}</span>
            </label>

            <label className="inline-label" styleName="email-option" htmlFor="data-change">
              <input
                checked={_.get(subCategoryData, ['data_change', 'enable'], false)}
                onChange={() => onAlertNotificationChange(category, null, 'data_change')}
                id="data-change"
                type="checkbox" />
              <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.all_assets.data_change')}</span>
            </label>

            <label className="inline-label" styleName="email-option" htmlFor="permission-change">
              <input
                checked={_.get(subCategoryData, ['permission_change', 'enable'], false)}
                onChange={() => onAlertNotificationChange(category, null, 'permission_change')}
                id="permission-change"
                type="checkbox" />
              <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.all_assets.permission_change')}</span>
            </label>
            {collaboratorsTag}
          </div>
        </td>

        <td className="column-description">
          <OnOffSwitch
            enableSwitch={categoryData.enable_product_notification}
            onSwitchChange={() => onAlertNotificationChange(category, 'product')} />
        </td>

        <td>
          <label className="inline-label" styleName="email-option" htmlFor="notify-subscribe-all-assets">
            <input
              checked={categoryData.enable_email}
              id="notify-subscribe-all-assets"
              type="checkbox"
              onChange={() => onAlertNotificationChange(category, 'email')} />
            <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.subscribe_email')}</span>
          </label>
        </td>
      </tr>
    );
  }

  renderNewAssets() {
    const {
      onAlertNotificationChange,
      preferences,
      isSuperAdmin,
      currentUserRole
    } = this.props;
    const category = 'new_assets';
    const categoryData = _.get(preferences, category, {});
    if (!isSuperAdmin && currentUserRole !== 'administrator') {
      return null;
    } else {
      return (
        <tr>
          <td>
            <div styleName="preference-name">
              {I18n.t('shared_site_chrome_notifications.alert_setting_modal.new_assets.title')}
            </div>
            <div styleName="preference-description">
              {I18n.t('shared_site_chrome_notifications.alert_setting_modal.new_assets.description')}
            </div>
          </td>
          <td className="column-description">
            <OnOffSwitch
              enableSwitch={categoryData.enable_product_notification}
              onSwitchChange={() => onAlertNotificationChange(category, 'product')} />
          </td>

          <td>
            <label
              className="inline-label"
              styleName="email-option"
              htmlFor="notify-subscribe-new-assets">
              <input
                checked={categoryData.enable_email}
                id="notify-subscribe-new-assets"
                type="checkbox"
                onChange={() => onAlertNotificationChange(category, 'email')} />
              {I18n.t('shared_site_chrome_notifications.alert_setting_modal.subscribe_email')}
            </label>
          </td>
        </tr>
      );
    }
  }

  renderRotingAndApproval() {
    // only for admin
    const {
      onAlertNotificationChange,
      preferences,
      isSuperAdmin,
      currentUserRole
    } = this.props;
    const category = 'routing_and_approval';
    const categoryData = _.get(preferences, category, {});
    const subCategoryData = _.get(categoryData, 'sub_categories', {});
    let routingAndApprovalRow = null;

    if (isSuperAdmin || currentUserRole === 'administrator') {
      routingAndApprovalRow = (
        <tr>
          <td>
            <div styleName="preference-name">
              {I18n.t('shared_site_chrome_notifications.alert_setting_modal.routing_and_approval.title')}
            </div>
            <div styleName="preference-types">
              <label className="inline-label" styleName="email-option" htmlFor="asset-review">
                <input
                  id="asset-review"
                  type="checkbox"
                  checked={_.get(subCategoryData, ['asset_review', 'enable'], false)}
                  onChange={(event) => onAlertNotificationChange(category, null, 'asset_review')} />
                <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.routing_and_approval.asset_review')}</span>
              </label>

              <label className="inline-label" styleName="email-option" htmlFor="asset-approved">
                <input
                  checked={_.get(subCategoryData, ['asset_approved', 'enable'], false)}
                  onChange={() => onAlertNotificationChange(category, null, 'asset_approved')}
                  id="asset-approved"
                  type="checkbox" />
                <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.routing_and_approval.asset_approved')}</span>
              </label>

              <label className="inline-label" styleName="email-option" htmlFor="asset-rejected">
                <input
                  checked={_.get(subCategoryData, ['asset_rejected', 'enable'], false)}
                  onChange={() => onAlertNotificationChange(category, null, 'asset_rejected')}
                  id="asset-rejected"
                  type="checkbox" />
                <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.routing_and_approval.asset_rejected')}</span>
              </label>
            </div>
          </td>
          <td className="column-description">
            <OnOffSwitch
              enableSwitch={categoryData.enable_product_notification}
              onSwitchChange={() => onAlertNotificationChange(category, 'product')} />
          </td>

          <td>
            <label
              className="inline-label"
              styleName="email-option"
              htmlFor="notify-subscribe-routing-approval">
              <input
                checked={categoryData.enable_email}
                id="notify-subscribe-routing-approval"
                type="checkbox"
                onChange={() => onAlertNotificationChange(category, 'email')} />
              <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.subscribe_email')}</span>
            </label>
          </td>
        </tr>
      );
    }
    return routingAndApprovalRow;
  }

  renderUserAccounts() {
    // only for admin
    const {
      onAlertNotificationChange,
      preferences,
      currentUserRole,
      isSuperAdmin
    } = this.props;
    const category = 'user_accounts';
    const categoryData = _.get(preferences, category, {});

    if (isSuperAdmin || currentUserRole === 'administrator') {
      return (
        <tr>
          <td>
            <div styleName="preference-name">
              {I18n.t('shared_site_chrome_notifications.alert_setting_modal.user_accounts.title')}
            </div>
            <div styleName="preference-description">
              {I18n.t('shared_site_chrome_notifications.alert_setting_modal.user_accounts.description')}
            </div>
          </td>
          <td className="column-description">
            <OnOffSwitch
              enableSwitch={categoryData.enable_product_notification}
              onSwitchChange={() => onAlertNotificationChange(category, 'product')} />
          </td>

          <td>
            <label className="inline-label" styleName="email-option" htmlFor="notify-subscribe-user-accounts">
              <input
                checked={categoryData.enable_email}
                id="notify-subscribe-user-accounts"
                type="checkbox"
                onChange={() => onAlertNotificationChange(category, 'email')} />
              <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.subscribe_email')}</span>
            </label>
          </td>
        </tr>
      );
    }
  }

  renderDeleteAssets() {
    const { onAlertNotificationChange, preferences } = this.props;
    const category = 'delete_asset';
    const categoryData = _.get(preferences, category, {});
    return (
      <tr>
        <td>
          <div styleName="preference-name">
            {I18n.t('shared_site_chrome_notifications.alert_setting_modal.delete_assets.title')}
          </div>
          <div styleName="preference-description">
            {I18n.t('shared_site_chrome_notifications.alert_setting_modal.delete_assets.description')}
          </div>
        </td>
        <td className="column-description">
          <OnOffSwitch
            enableSwitch={categoryData.enable_product_notification}
            onSwitchChange={() => onAlertNotificationChange(category, 'product')} />
        </td>

        <td>
          <label className="inline-label" styleName="email-option" htmlFor="notify-subscribe-delete-assets">
            <input
              checked={categoryData.enable_email}
              id="notify-subscribe-delete-assets"
              type="checkbox"
              onChange={() => onAlertNotificationChange(category, 'email')} />
            <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.subscribe_email')}</span>
          </label>
        </td>
      </tr>
    );
  }

  renderMyAssets() {
    const { onAlertNotificationChange, preferences } = this.props;
    const category = 'my_assets';
    const categoryData = _.get(preferences, category, {});
    return (
      <tr>
        <td>
          <div styleName="preference-name">
            {I18n.t('shared_site_chrome_notifications.alert_setting_modal.my_assets.title')}
          </div>
          <div styleName="preference-description">
            {I18n.t('shared_site_chrome_notifications.alert_setting_modal.my_assets.description')}
          </div>
        </td>
        <td className="column-description">
          <OnOffSwitch
            enableSwitch={categoryData.enable_product_notification}
            onSwitchChange={() => onAlertNotificationChange(category, 'product')} />
        </td>

        <td>
          <label className="inline-label" styleName="email-option" htmlFor="notify-subscribe-my-assets">
            <input
              checked={categoryData.enable_email}
              id="notify-subscribe-my-assets"
              type="checkbox"
              onChange={() => onAlertNotificationChange(category, 'email')} />
            <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.subscribe_email')}</span>
          </label>
        </td>
      </tr>
    );
  }

  renderWatchList() {
    const { onAlertNotificationChange, preferences } = this.props;
    const category = 'watch_list';
    const categoryData = _.get(preferences, category, {});

    return (
      <tr>
        <td>
          <div styleName="preference-name">
            {I18n.t('shared_site_chrome_notifications.alert_setting_modal.watch_list.title')}
          </div>
          <div styleName="preference-description">
            {I18n.t('shared_site_chrome_notifications.alert_setting_modal.watch_list.description')}
          </div>
        </td>
        <td className="column-description">
          <OnOffSwitch
            enableSwitch={categoryData.enable_product_notification}
            onSwitchChange={() => onAlertNotificationChange(category, 'product')} />
        </td>

        <td>
          <label className="inline-label" styleName="email-option" htmlFor="notify-subscribe-watch-list">
            <input
              checked={categoryData.enable_email}
              id="notify-subscribe-watch-list"
              type="checkbox"
              onChange={() => onAlertNotificationChange(category, 'email')} />
            <span>{I18n.t('shared_site_chrome_notifications.alert_setting_modal.subscribe_email')}</span>
          </label>
        </td>
      </tr>
    );
  }

  render() {
    const {
      currentDomainFeatures,
      settings,
      onSettingsChange,
      showTransientNotifications
    } = this.props;
    const showRoutingAndApproval = _.get(currentDomainFeatures, 'routing_approval', false);

    return (
      <div>
        <div className="table-wrapper">
          <table className="table table-borderless table-condensed table-discrete">
            <thead>
              <tr>
                <th scope="col" className="column-name">
                  <span>
                    {I18n.t('shared_site_chrome_notifications.alert_setting_modal.table_header.feature')}
                  </span>
                </th>

                <th scope="col" className="column-description">
                  <span>
                    {I18n.t(
                      'shared_site_chrome_notifications.alert_setting_modal.table_header.product_alerts')}
                  </span>
                </th>

                <th scope="col" className="column-type">
                  <span>
                    {I18n.t(
                      'shared_site_chrome_notifications.alert_setting_modal.table_header.email_notifications'
                    )}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
            {this.renderWatchList()}
            {showRoutingAndApproval ? this.renderRotingAndApproval() : this.renderNewAssets()}
            {this.renderAllAssets()}
            {this.renderMyAssets()}
            {this.renderDeleteAssets()}
            {this.renderUserAccounts()}
            </tbody>
          </table>
        </div>
        <EmailSettings settings={settings} onSettingsChange={onSettingsChange} />
        <NotificationSettings
          showTransientNotifications={showTransientNotifications}
          settings={settings}
          onSettingsChange={onSettingsChange} />
      </div>
    );
  }
}

PreferenceContent.propTypes = {
  preferences: PropTypes.object.isRequired,
  settings: PropTypes.object.isRequired,
  onAlertNotificationChange: PropTypes.func,
  showTransientNotifications: PropTypes.bool,
  onSettingsChange: PropTypes.func
};

export default cssModules(PreferenceContent, styles, { allowMultiple: true });
