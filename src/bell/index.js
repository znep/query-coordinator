import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'socrata-components';
import styles from './bell.scss';

class Bell extends React.Component {
  renderUnreadIcon() {
    const {
      hasUnread
    } = this.props;

    if (hasUnread === true) {
      return (
        <svg styleName="unread-icon" className="socrata-notifications-unread-icon" viewBox="0 0 2 2">
          <circle cx="1" cy="1" r="1" />
        </svg>
      );
    }

    return null;
  }

  render() {
    const {
      onClick
    } = this.props;

    return (
      <button styleName="button" className="socrata-notifications-bell" onClick={onClick}>
        {this.renderUnreadIcon()}
        <SocrataIcon name="bell" />
      </button>
    );
  }
}

Bell.propTypes = {
  onClick: PropTypes.func,
  hasUnread: PropTypes.bool
};

Bell.defaultProps = {
  onClick: () => { },
  hasUnread: false,
  width: 22,
  height: 22,
  unreadCircleX: 21,
  unreadCircleY: 8,
  unreadCircleRadius: 5
};

export default cssModules(Bell, styles);
