import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './bell.css';

class Bell extends React.Component {
  render() {
    return (
      <div styleName="container">
        <svg styleName={`bell-svg-${this.props.theme}`} width="24" height="24" viewBox="0 0 24 24">
          <g>
            <path d="M18,14V9c0-3.3-2.7-6-6-6S6,5.7,6,9v5c0,1.7-1.3,3-3,3v1h18v-1C19.3,17,18,15.7,18,14z"/>
            <path d="M8.6,19c0.7,1.2,2,2,3.4,2s2.8-0.8,3.4-2H8.6z"/>
          </g>
        </svg>
      </div>
    );
  }
}

Bell.propTypes = {
  theme: PropTypes.oneOf(['dark', 'light'])
};

export default cssModules(Bell, styles);
