import PropTypes from 'prop-types';
import React from 'react';

export const FlannelContent = (props) => (
  <section className="socrata-flannel-content">{props.children}</section>
);

FlannelContent.propTypes = {
  children: PropTypes.node
};

export default FlannelContent;
