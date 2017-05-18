import React, { PropTypes } from 'react';

export const FlannelFooter = (props) => (
  <div className="socrata-flannel-actions">{props.children}</div>
);

FlannelFooter.propTypes = {
  children: PropTypes.node
};

export default FlannelFooter;
