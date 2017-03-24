import React, { PropTypes } from 'react';

const Tag = ({ tagName, onTagClick }) =>
  <li className="tag cf" onClick={onTagClick}>
    {tagName}
    <span className="socrata-icon-close-2"></span>
  </li>;

Tag.propTypes = {
  tagName: PropTypes.string.isRequired,
  onTagClick: PropTypes.func
};

export default Tag;
