import _ from 'lodash';
import $ from 'jquery';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';

import connectLocalization from 'common/i18n/components/connectLocalization';

import { THROTTLE_LAZY_LOADING_FOR } from 'common/notifications/constants';
import UserNotification from './UserNotification';
import styles from './user-notification-list.module.scss';

const scope = 'shared_site_chrome_notifications';

class UserNotificationList extends Component {
  componentDidMount() {
    this.lazyLoadUserNotifications();
  }

  lazyLoadUserNotifications = () => {
    const { onLoadMoreUserNotifications } = this.props;
    const self = this;

    $('#activity-notification-items, #alert-notification-items').scroll(_.throttle(() => {
      const $loadMoreNotificationsWrapper = $('#load-more-notifications-wrapper');

      if ($loadMoreNotificationsWrapper.find('.load-more-user-notifications-link').is(':visible')) {
        if (self.isElementInViewport($loadMoreNotificationsWrapper.get(0))) {
          onLoadMoreUserNotifications($loadMoreNotificationsWrapper.data('notifications-type'));
        }
      }
    }, THROTTLE_LAZY_LOADING_FOR));
  }

  isElementInViewport = (element) => {
    const elementBounding = element.getBoundingClientRect();

    return elementBounding.top >= 0 &&
      elementBounding.left >= 0 &&
      elementBounding.right <= (window.innerWidth || document.documentElement.clientWidth) &&
      elementBounding.bottom <= (window.innerHeight || document.documentElement.clientHeight);
  }

  renderUserNotifications = () => {
    const {
      userNotifications,
      filterNotificationsBy,
      onClearUserNotification,
      onToggleReadUserNotification,
      I18n
    } = this.props;
    const notifications = _.get(userNotifications[filterNotificationsBy], 'notifications', []);

    if (_.isEmpty(notifications)) {
      return (
        <div
          className="no-user-notifications-message"
          styleName="no-notifications-message">
          <h3>{I18n.t('no_filtered_notifications', { scope })}</h3>
        </div>
      );
    }

    return notifications.map((notification) =>
      <UserNotification
        isTransientNotification={false}
        key={notification.id}
        notification={notification}
        onClearUserNotification={onClearUserNotification}
        onToggleReadUserNotification={onToggleReadUserNotification} />
    );
  }

  renderLoadMoreUserNotificationLink = () => {
    const { userNotifications, filterNotificationsBy } = this.props;
    const hasMoreNotifications = _.get(userNotifications[filterNotificationsBy], 'hasMoreNotifications', false);

    if (hasMoreNotifications) {
      const { onLoadMoreUserNotifications, I18n } = this.props;
      const loadingNotifications = _.get(userNotifications[filterNotificationsBy], 'loading', false);
      const loadingSpinner = (
        <div styleName="notifications-loading">
          <span className="spinner-default" />
          <span styleName="notifications-loading-text">{I18n.t('loading', { scope })}</span>
        </div>
      );
      const loadMoreLink = (
        <button
          className="load-more-user-notifications-link"
          styleName="load-more-user-notifications-link"
          onClick={() => { onLoadMoreUserNotifications(filterNotificationsBy); }}>
          {I18n.t('load_more_items', { scope })}
        </button>
      );

      return (
        <div
          className="load-more-user-notifications"
          data-notifications-type={filterNotificationsBy}
          id="load-more-notifications-wrapper"
          styleName="load-more-user-notifications-link-wrapper">
          {loadingNotifications ? loadingSpinner : loadMoreLink}
        </div>
      );
    }
  }

  renderSeeMoreNotificationsLink = () => {
    const { filterNotificationsBy, hasEnqueuedUserNotifications } = this.props;

    if (hasEnqueuedUserNotifications(filterNotificationsBy)) {
      const { onSeeNewUserNotifications, I18n } = this.props;

      return (
        <div
          className="see-new-user-notifications"
          styleName="see-new-user-notifications-link-wrapper">
          <button styleName="see-new-user-notifications-link" onClick={() => { onSeeNewUserNotifications(filterNotificationsBy); }}>
            {I18n.t('see_new_notifications', { scope })}
          </button>
        </div>
      );
    }
  }

  render() {
    return (
      <div>
        {this.renderSeeMoreNotificationsLink()}
        <ul styleName="socrata-user-notification-list">{this.renderUserNotifications()}</ul>
        {this.renderLoadMoreUserNotificationLink()}
      </div>
    );
  }
}

UserNotificationList.propTypes = {
  filterNotificationsBy: PropTypes.string.isRequired,
  hasEnqueuedUserNotifications: PropTypes.func.isRequired,
  onClearUserNotification: PropTypes.func.isRequired,
  onLoadMoreUserNotifications: PropTypes.func.isRequired,
  onSeeNewUserNotifications: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired
};

UserNotificationList.defaultProps = {
  userNotifications: null
};

export default connectLocalization(cssModules(UserNotificationList, styles, { allowMultiple: true }));
