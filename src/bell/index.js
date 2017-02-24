/* eslint-disable max-len */

import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './bell.scss';

class Bell extends React.Component {
  renderUnreadIcon() {
    const {
      hasUnread
    } = this.props;

    if (hasUnread === true) {
      return (
        <svg styleName="unread-icon" viewBox="0 0 2 2">
          <circle cx="1" cy="1" r="1" />
        </svg>
      );
    }

    return null;
  }

  render() {
    const {
      width,
      height,
      theme,
      onClick
    } = this.props;
    return (
      // eslint-disable-next-line
      <div styleName="container" onClick={onClick}>
        {this.renderUnreadIcon()}
        <svg styleName={`svg-${theme}`} viewBox="0 0 16 16" height={height} width={width}>
          <path
            d="M 6.5417672,13.541663 C 6.5417672,14.35185 7.1899706,15 8.0002275,15 8.8104843,15 9.4586877,14.35185 9.4586877,13.541663 l -2.9169205,0 z m 8.4428158,-1.344911 c 0.032,-0.113426 0.016,-0.243056 -0.06501,-0.324075 l -2.54421,-2.527784 0,-3.9699184 c 0,-2.414358 -1.960761,-4.3750119 -4.3753406,-4.3750119 -2.4145591,0 -4.3753708,1.9606539 -4.3753708,4.3750119 l 0,3.9699184 -2.5441999,2.527784 c -0.0810067,0.08102 -0.097208,0.210649 -0.064805,0.324075 0.048604,0.113426 0.1620533,0.178241 0.2754927,0.178241 l 13.4178166,0 c 0.113409,0 0.226818,-0.06481 0.275422,-0.178241 z" />
        </svg>
      </div>
    );
  }
}

Bell.propTypes = {
  theme: PropTypes.oneOf(['dark', 'light']),
  onClick: PropTypes.func,
  hasUnread: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number
};

Bell.defaultProps = {
  theme: 'dark',
  onClick: () => { },
  hasUnread: false,
  width: 22,
  height: 22,
  unreadCircleX: 21,
  unreadCircleY: 8,
  unreadCircleRadius: 5
};

export default cssModules(Bell, styles);
