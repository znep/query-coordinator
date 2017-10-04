import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import classNames from 'classnames';
import _ from 'lodash';

import connectLocalization from 'common/i18n/components/connectLocalization';

import ProductNotification from './ProductNotification';
import Spinner from 'common/notifications/components/Spinner';
import ErrorMessage from 'common/notifications/components/ErrorMessage';
import styles from './product-notification-list.scss';

class ProductNotificationList extends Component {
  renderUnreadNewCountLabel() {
    const {
      unreadProductNotificationCount,
      I18n
    } = this.props;

    if (unreadProductNotificationCount > 0) {
      return (
        <em styleName="unread-count-label">
          {unreadProductNotificationCount}
          &nbsp;
          {I18n.t('new_label')}
        </em>
      );
    }
  }

  renderAccordionIcon() {
    const { isSecondaryPanelOpen } = this.props;

    return (
      <em styleName="header-icon"
        className={classNames({
          'socrata-icon-close-2': isSecondaryPanelOpen,
          'socrata-icon-chevron-up': !isSecondaryPanelOpen
        })}>
      </em>
    );
  }

  renderSecondaryPanelHeader() {
    const { showProductNotificationsAsSecondaryPanel } = this.props;

    if (showProductNotificationsAsSecondaryPanel) {
      const {
        unreadProductNotificationCount,
        toggleProductNotificationsSecondaryPanel,
        I18n
      } = this.props;

      return (
        <div styleName="accordion-header" className="secondary-panel">
          <h3 styleName={classNames('panel-header-text', { unread: unreadProductNotificationCount > 0 })}
            onClick={toggleProductNotificationsSecondaryPanel}>
            {I18n.t('product_updates')}
            {this.renderUnreadNewCountLabel()}
            {this.renderAccordionIcon()}
          </h3>
        </div>
      )
    }
  }

  renderNotifications() {
    const {
      areNotificationsLoading,
      hasError,
      isSecondaryPanelOpen,
      notifications,
      showProductNotificationsAsSecondaryPanel,
      I18n
    } = this.props;
    const errorText = I18n.t('error_text_html');

    if (!showProductNotificationsAsSecondaryPanel || isSecondaryPanelOpen) {
      if (areNotificationsLoading) {
        return <Spinner />;
      } else if (hasError) {
        return (
          <div styleName='notifications-message'
            className='notifications-error-message-wrapper'>
            <ErrorMessage text={errorText} />
          </div>
        );
      } else {
        if (_.size(notifications) > 0) {
          return notifications.map(notification =>
            <ProductNotification key={notification.id} {...notification} />
          );
        } else {
          return (
            <div styleName='notifications-message'
              className='no-notifications-message-wrapper'>
              <h3>{I18n.t('no_unread_notifications')}</h3>
            </div>
          );
        }
      }
    }
  }

  renderViewOlderLink() {
    const {
      areNotificationsLoading,
      viewOlderLink,
      I18n
    } = this.props;

    if (!_.isNull(viewOlderLink) && !areNotificationsLoading) {
      return (
        <div className="view-older"
          styleName='view-older-links-wrapper'>
          <a href={viewOlderLink}
            styleName='view-older-link'
            target='_blank'>
            {I18n.t('view_older')}
          </a>
        </div>
      );
    }
  }

  render() {
    const {
      isSecondaryPanelOpen,
      notifications,
      viewOlderLink,
      showProductNotificationsAsSecondaryPanel
    } = this.props;
    const notificationStyleNames = classNames('list-wrapper', {
      'secondary-panel': showProductNotificationsAsSecondaryPanel,
      'open': isSecondaryPanelOpen
    });

    return (
      <div styleName={notificationStyleNames}>
        {this.renderSecondaryPanelHeader()}

        <ul styleName={classNames('list', { 'has-no-view-older-link': _.isNull(viewOlderLink) })}>
          {this.renderNotifications()}
        </ul>

        {this.renderViewOlderLink()}
      </div>
    );
  }
}

ProductNotificationList.propTypes = {
  areNotificationsLoading: PropTypes.bool.isRequired,
  hasError: PropTypes.bool.isRequired,
  isSecondaryPanelOpen: PropTypes.bool,
  notifications: PropTypes.array.isRequired,
  showProductNotificationsAsSecondaryPanel: PropTypes.bool,
  toggleProductNotificationsSecondaryPanel: PropTypes.func,
  unreadProductNotificationCount: PropTypes.number,
  viewOlderLink: PropTypes.string
}

ProductNotificationList.defaultProps = {
  isSecondaryPanelOpen: false,
  showProductNotificationsAsSecondaryPanel: false,
  toggleProductNotificationsSecondaryPanel: () => {},
  unreadProductNotificationCount: 0,
  viewOlderLink: null
}

export default connectLocalization(cssModules(ProductNotificationList, styles, { allowMultiple: true }));
