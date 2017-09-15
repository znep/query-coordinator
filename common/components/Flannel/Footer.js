import PropTypes from 'prop-types';
import React from 'react';

export const FlannelFooter = (props) => (
  <div className="socrata-flannel-actions">{props.children}</div>
);

FlannelFooter.propTypes = {
  children: PropTypes.node
};

export default FlannelFooter;
