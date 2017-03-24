import React, { PropTypes } from 'react';

const Fieldset = ({ children, title, subtitle, isPrivate }) =>
  <fieldset className="fieldset">
    <legend id="tab-title">
      {title}
      {isPrivate && <span className="socrata-icon-private"></span>}
    </legend>
    <span id="tab-subtitle">{subtitle}</span>
    {children}
  </fieldset>;

Fieldset.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.any,
  isPrivate: PropTypes.bool
};

export default Fieldset;
