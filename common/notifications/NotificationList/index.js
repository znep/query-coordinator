import PropTypes from 'prop-types';
import React from 'react';
import cssModules from 'react-css-modules';
import ListHeader from './ListHeader';
import ViewMoreLink from './ViewMoreLink';
import NotificationWithDivider from './NotificationWithDivider';
import ErrorMessage from './ErrorMessage';
import Spinner from './Spinner';
import styles from './list.scss';
import NotificationPropTypes from '../PropTypes/NotificationPropTypes';

function errorOrList(notifications, hasError, errorText) {
  if (!notifications && !hasError) {
    return (<Spinner />);
  } else if (hasError) {
    return (
      <div>
        <div styleName="divider" />
        <ErrorMessage text={errorText} />
      </div>
    );
  } else {
    return notifications.map(notification =>
      <NotificationWithDivider key={notification.id} notification={notification} />);
  }
}

function NotificationList({
  hasError,
  errorText,
  notifications,
  productUpdatesText,
  viewOlderText,
  viewOlderLink }) {
  return (
    <div className="socrata-notifications-list" styleName="container">
      <ListHeader text={productUpdatesText} />
      {errorOrList(notifications, hasError, errorText)}
      <ViewMoreLink text={viewOlderText} link={viewOlderLink} />
    </div>
  );
}

NotificationList.propTypes = {
  hasError: PropTypes.bool.isRequired,
  errorText: PropTypes.string.isRequired,
  notifications: PropTypes.arrayOf(PropTypes.shape(NotificationPropTypes)),
  viewOlderLink: PropTypes.string.isRequired,
  productUpdatesText: PropTypes.string.isRequired,
  viewOlderText: PropTypes.string.isRequired
};

NotificationList.defaultProps = {
  notifications: null,
  viewOlderLink: ''
};

export default cssModules(NotificationList, styles);
