/* eslint-disable max-len */

import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './bell.scss';

class Bell extends React.Component {
  renderUnreadIcon() {
    const {
      hasUnread,
      unreadCircleX,
      unreadCircleY,
      unreadCircleRadius
    } = this.props;

    if (hasUnread === true) {
      return (
        <circle cx={unreadCircleX} cy={unreadCircleY} r={unreadCircleRadius} styleName="unread-icon" />
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
        <svg styleName={`svg-${theme}`} width={width} height={height} viewBox="0 0 32 32">
          <g>
            {/* Top part of bell */}
            <path d="m 22,16.811427 0,-3.400853 c 0,-3.225564 -2.7,-5.160577 -6,-5.160577 -3.3,0 -6,1.935013 -6,5.160577 l 0,3.400853 c 0,2.204042 -1.3,3.461126 -3,3.461126 l 0,0.977444 18,0 0,-0.977444 c -1.7,0 -3,-1.257084 -3,-3.461126 z" />

            {/* The clapper */}
            <path d="m 18.5,21.95 a 2.6286557,2.6049843 0 0 1 -2.5,1.8 2.6286557,2.6049843 0 0 1 -2.5,-1.8" />
            {this.renderUnreadIcon()}
          </g>
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
  height: PropTypes.number,
  unreadCircleX: PropTypes.number,
  unreadCircleY: PropTypes.number,
  unreadCircleRadius: PropTypes.number
};

Bell.defaultProps = {
  theme: 'dark',
  onClick: () => { },
  hasUnread: false,
  width: 32,
  height: 32,
  unreadCircleX: 21,
  unreadCircleY: 8,
  unreadCircleRadius: 5
};

export default cssModules(Bell, styles);
