import PropTypes from 'prop-types';
import React from 'react';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'common/components/SocrataIcon';
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
      onClick,
      label
    } = this.props;

    return (
      <button
        styleName="button"
        className="socrata-notifications-bell"
        onClick={onClick}
        tabIndex="0"
        aria-haspopup="true"
        aria-label={label}>
        <SocrataIcon name="bell" />
        {this.renderUnreadIcon()}
      </button>
    );
  }
}

Bell.propTypes = {
  onClick: PropTypes.func,
  hasUnread: PropTypes.bool,
  label: PropTypes.string
};

Bell.defaultProps = {
  onClick: () => { },
  hasUnread: false,
  label: 'Product Updates'
};

export default cssModules(Bell, styles);
