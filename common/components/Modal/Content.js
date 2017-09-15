import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

export const Content = (props) => {
  const { children, className } = props;

  const contentClasses = classNames({
    'modal-content': true,
    [className]: !!className
  });

  return (
    <section className={contentClasses}>
      {children}
    </section>
  );
};

Content.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

export default Content;
