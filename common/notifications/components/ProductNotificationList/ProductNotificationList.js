import _ from 'lodash';
import classNames from 'classnames';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import connectLocalization from 'common/i18n/components/connectLocalization';
import { SocrataIcon } from 'common/components/SocrataIcon';
import Spinner from 'common/notifications/components/Spinner';

import ErrorMessage from 'common/notifications/components/ErrorMessage';
import ProductNotification from './ProductNotification';
import styles from './product-notification-list.module.scss';

const scope = 'shared_site_chrome_notifications';

class ProductNotificationList extends Component {
  renderUnreadNewCountLabel = () => {
    const { I18n, unreadProductNotificationCount } = this.props;

    if (unreadProductNotificationCount > 0) {
      return (
        <em styleName="unread-count-label">
          <span>{unreadProductNotificationCount}</span>
          <span>{I18n.t('new_label', { scope })}</span>
        </em>
      );
    }
  }

  renderAccordionIcon = () => {
    const { isSecondaryPanelOpen } = this.props;
    const iconName = isSecondaryPanelOpen ? 'close-2' : 'chevron-up';

    return <SocrataIcon name={iconName} />;
  }

  renderSecondaryPanelHeader() {
    const { showProductNotificationsAsSecondaryPanel } = this.props;

    if (showProductNotificationsAsSecondaryPanel) {
      const {
        I18n,
        toggleProductNotificationsSecondaryPanel,
        unreadProductNotificationCount
      } = this.props;

      return (
        <div styleName="accordion-header" className="secondary-panel">
          <h3
            styleName={classNames('panel-header-text', { unread: unreadProductNotificationCount > 0 })}
            onClick={toggleProductNotificationsSecondaryPanel}>
            {I18n.t('product_updates', { scope })}
            {this.renderUnreadNewCountLabel()}
            {this.renderAccordionIcon()}
          </h3>
        </div>
      );
    }
  }

  renderNotifications() {
    const {
      areProductNotificationsLoading,
      hasError,
      I18n,
      isSecondaryPanelOpen,
      notifications,
      showProductNotificationsAsSecondaryPanel
    } = this.props;
    const errorText = I18n.t('error_text_html', { scope });

    if (!showProductNotificationsAsSecondaryPanel || isSecondaryPanelOpen) {
      if (areProductNotificationsLoading) {
        return <Spinner />;
      }

      if (hasError) {
        return (
          <div
            styleName="notifications-message"
            className="notifications-error-message-wrapper">
            <ErrorMessage text={errorText} />
          </div>
        );
      }

      if (_.size(notifications) > 0) {
        return notifications.map(notification =>
          <ProductNotification key={notification.id} {...notification} />
        );
      }

      return (
        <div
          styleName="notifications-message"
          className="no-notifications-message-wrapper">
          <h3>{I18n.t('no_unread_notifications', { scope })}</h3>
        </div>
      );
    }
  }

  renderViewOlderLink = () => {
    const { areProductNotificationsLoading, I18n, viewOlderLink } = this.props;

    if (!_.isNull(viewOlderLink) && !areProductNotificationsLoading) {
      return (
        <div
          className="view-older"
          styleName="view-older-links-wrapper">
          <a
            href={viewOlderLink}
            styleName="view-older-link"
            target="_blank">
            {I18n.t('view_older', { scope })}
          </a>
        </div>
      );
    }
  }

  render() {
    const {
      isSecondaryPanelOpen,
      notifications,
      showProductNotificationsAsSecondaryPanel,
      viewOlderLink
    } = this.props;
    const notificationStyleNames = classNames('list-wrapper', {
      'open': isSecondaryPanelOpen,
      'secondary-panel': showProductNotificationsAsSecondaryPanel
    });
    const notificationListStyleNames = classNames('list', {
      'has-no-view-older-link': _.isNull(viewOlderLink)
    });

    return (
      <div styleName={notificationStyleNames}>
        {this.renderSecondaryPanelHeader()}
        <ul styleName={notificationListStyleNames}>{this.renderNotifications()}</ul>
        {this.renderViewOlderLink()}
      </div>
    );
  }
}

ProductNotificationList.propTypes = {
  areProductNotificationsLoading: PropTypes.bool.isRequired,
  hasError: PropTypes.bool.isRequired,
  isSecondaryPanelOpen: PropTypes.bool,
  notifications: PropTypes.array.isRequired,
  showProductNotificationsAsSecondaryPanel: PropTypes.bool,
  toggleProductNotificationsSecondaryPanel: PropTypes.func,
  unreadProductNotificationCount: PropTypes.number,
  viewOlderLink: PropTypes.string
};

ProductNotificationList.defaultProps = {
  isSecondaryPanelOpen: false,
  showProductNotificationsAsSecondaryPanel: false,
  toggleProductNotificationsSecondaryPanel: () => {},
  unreadProductNotificationCount: 0,
  viewOlderLink: null
};

export default connectLocalization(cssModules(ProductNotificationList, styles, { allowMultiple: true }));
