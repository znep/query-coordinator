import { classNames } from './utils';
import PropTypes from 'prop-types';
import React from 'react';

const Spinner = ({className, isLoading}) => (
  <div className={classNames(className)} style={{ display: isLoading ? 'block' : 'none' }}>
    <span />
  </div>
);

Spinner.propTypes = {
  className: PropTypes.string,
  isLoading: PropTypes.bool
};

Spinner.defaultProps = {
  isLoading: false
};

export default Spinner;
