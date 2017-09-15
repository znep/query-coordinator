import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

export const Footer = (props) => {
  const { children, className } = props;

  const footerClasses = classNames({
    'modal-footer': true,
    [className]: !!className
  });

  return (
    <footer className={footerClasses}>
      <div className="modal-footer-actions">
        {children}
      </div>
    </footer>
  );
};

Footer.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

export default Footer;
