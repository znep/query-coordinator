import PropTypes from 'prop-types';
import React from 'react';
import cssModules from 'react-css-modules';
import styles from './circle-divider.scss';

function CircleDivider({ text }) {
  return (
    <svg styleName="circle-divider">
      <line
        styleName="line"
        x1="0" y1="50%"
        x2="100%" y2="50%" />
      <circle
        styleName="circle"
        r="17" cx="50%" cy="50%" />
      <text
        styleName="text"
        x="50%" y="61%">
          {text}
      </text>
    </svg>
  );
}

CircleDivider.propTypes = {
  text: PropTypes.string
};

export default cssModules(CircleDivider, styles);
