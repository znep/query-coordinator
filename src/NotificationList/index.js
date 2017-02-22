import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import styles from './list.scss';
import Notification from './Notification';
import SocrataLogo from '../SocrataLogo';
import NotificationPropTypes from '../PropTypes/NotificationPropTypes';

function NotificationWithDivider({ notification }) {
  return (
    <div>
      <div styleName="divider" />
      <Notification {...notification} />
    </div>
  );
}

NotificationWithDivider.propTypes = {
  notification: PropTypes.shape(NotificationPropTypes).isRequired
};

const StylizedNotificationWithDivider = cssModules(NotificationWithDivider, styles);

function Header({ text }) {
  return (
    <div styleName="header">
      <SocrataLogo />
      <span>
        {text}
      </span>
    </div>
  );
}

Header.propTypes = {
  text: PropTypes.string.isRequired
};

const StylizedHeader = cssModules(Header, styles);

function ViewMore({ link, text }) {
  if (_.isEmpty(link) || _.isEmpty(text)) {
    return null;
  } else {
    return (
      <div styleName="view-older">
        <a
          styleName="view-older-link"
          href={link}
          target="_blank"
          rel="noopener noreferrer">
          {text}
        </a>
      </div>
    );
  }
}

ViewMore.propTypes = {
  link: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired
};

const StylizedViewMore = cssModules(ViewMore, styles);

function ErrorMessage({ text }) {
  return (
    // eslint-disable-next-line react/no-danger
    <div styleName="error-message" dangerouslySetInnerHTML={{ __html: text }} />
  );
}

ErrorMessage.propTypes = {
  text: PropTypes.string.isRequired
};

const StylizedErrorMessage = cssModules(ErrorMessage, styles);

function Spinner() {
  return (
    <div>
      <div styleName="divider" />
      <div styleName="spinner" />
    </div>
  );
}

const StylizedSpinner = cssModules(Spinner, styles);

function errorOrList(notifications, hasError, errorText) {
  if (_.isEmpty(notifications) && !hasError) {
    return (<StylizedSpinner />);
  } else if (hasError) {
    return (
      <div>
        <div styleName="divider" />
        <StylizedErrorMessage text={errorText} />
      </div>
    );
  } else {
    return notifications.map(notification =>
      <StylizedNotificationWithDivider key={notification.id} notification={notification} />);
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
    <div styleName="container">
      <StylizedHeader text={productUpdatesText} />
      {errorOrList(notifications, hasError, errorText)}
      <StylizedViewMore text={viewOlderText} link={viewOlderLink} />
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
