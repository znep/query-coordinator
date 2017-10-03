import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import classNames from 'classnames';
import _ from 'lodash';
import Spinner from '../Spinner';
import ErrorMessage from '../ErrorMessage';
import ProductNotification from './ProductNotification';
import styles from './product-notification-list.scss';

class ProductNotificationList extends Component {
  renderNotifications() {
    const {
      areNotificationsLoading,
      errorText,
      hasError,
      notifications
    } = this.props;

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
          <div
            styleName='notifications-message'
            className='no-notifications-message-wrapper'>
            <h3>You have no unread notifications</h3>
          </div>
        );
      }
    }
  }

  renderViewOlderLink() {
    const {
      viewOlderLink,
      viewOlderText
    } = this.props;

    if (!_.isNull(viewOlderLink)) {
      return (
        <div styleName='view-older-links-wrapper'>
          <a href={viewOlderLink}
            styleName='view-older-link'
            className='dont-inherit-admin-styles'
            target='_blank'>
            {viewOlderText}
          </a>
        </div>
      );
    }
  }

  render() {
    const {
      notifications,
      viewOlderLink
    } = this.props;

    return (
      <div styleName={classNames('list-wrapper', { 'has-no-footer-bar': _.isEmpty(notifications) })}>
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
  errorText: PropTypes.string.isRequired,
  hasError: PropTypes.bool.isRequired,
  notifications: PropTypes.array.isRequired,
  viewOlderLink: PropTypes.string,
  viewOlderText: PropTypes.string.isRequired
}

export default cssModules(ProductNotificationList, styles, { allowMultiple: true });
