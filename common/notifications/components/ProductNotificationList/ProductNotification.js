import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import classNames from 'classnames';
import moment from 'moment-timezone';
import _ from 'lodash';

import { formatDateWithLocale } from 'common/dates';

import { TRUNCATE_DESCRIPTION_AFTER } from 'common/notifications/constants';
import styles from './product-notification.scss';

class ProductNotification extends Component {
  truncateBodyText() {
    const { body } = this.props;

    return _.truncate(
      body,
      {
        length: TRUNCATE_DESCRIPTION_AFTER,
        separator: /,?\.* +/ // separate by spaces, including preceding commas and periods
      }
    );
  }

  render() {
    const {
      dateTime,
      isUnread,
      title,
      titleLink
    } = this.props;

    return (
      <li styleName={classNames('notification-item', { 'unread': isUnread })}
        className={classNames('notification-item', { 'is-unread-notification': isUnread })}>
        <a styleName='notification-link'
           className="notification-title"
           href={titleLink}
           target='_blank'>
          {title}
        </a>

        <p styleName='body-text' className="notification-body">
          {this.truncateBodyText()}
        </p>

        <p styleName='timestamp' className="notification-timestamp">
          {formatDateWithLocale(moment.unix(dateTime))}
        </p>
      </li>
    );
  }
}

ProductNotification.propTypes = {
  body: PropTypes.string.isRequired,
  dateTime: PropTypes.number.isRequired,
  id: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]).isRequired,
  isUnread: PropTypes.bool,
  title: PropTypes.string.isRequired,
  titleLink: PropTypes.string
};

ProductNotification.defaultProps = {
  isUnread: true
};

export default cssModules(ProductNotification, styles, { allowMultiple: true });
