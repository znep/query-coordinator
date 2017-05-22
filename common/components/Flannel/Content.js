import React, { PropTypes } from 'react';

export const FlannelContent = (props) => (
  <section className="socrata-flannel-content">{props.children}</section>
);

FlannelContent.propTypes = {
  children: PropTypes.node
};

export default FlannelContent;
