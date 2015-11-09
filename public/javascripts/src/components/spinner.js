import { classNames } from './utils';
import React, { PropTypes } from 'react';

const Spinner = ({className, isLoading}) => (
  <div className={classNames(className)} style={{ display: isLoading ? 'block' : 'none' }}>
    <img src="/stylesheets/images/common/BrandedSpinner.gif"/>
  </div>
);

Spinner.propTypes = {
  classNames: PropTypes.string,
  isLoading: PropTypes.bool
};

Spinner.defaultProps = {
  isLoading: false
};

export default Spinner;
