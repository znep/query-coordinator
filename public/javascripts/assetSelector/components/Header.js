import React, { PropTypes } from 'react';

export const Header = (props) => (
  <div className="asset-selector-header">
    <h1>{props.title}</h1>
  </div>
);

Header.propTypes = {
  title: PropTypes.string.isRequired
};

Header.defaultProps = {
  title: ''
};

export default Header;
