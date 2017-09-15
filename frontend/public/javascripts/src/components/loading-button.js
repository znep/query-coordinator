import socrataTitleTipWrapper from './socrata-title-tip-wrapper';
import { classNames } from './utils';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

class LoadingButton extends PureComponent {
  render() {
    const { isLoading, children, disabled } = this.props;
    const className = classNames(
      'button',
      { disabled }
    );
    let spinnerStyle = { display: 'none' };
    let labelStyle = {};
    if (isLoading) {
      labelStyle = { visibility: 'hidden' };
      spinnerStyle = { display: 'block' };
    }
    return (
      <button
        className={className}
        name="commit"
        onClick={(event) => { if (disabled) { event.preventDefault(); }}}>
        <span style={labelStyle}>{children}</span>
        <span className="loading" style={spinnerStyle}></span>
      </button>
    );
  }
}

LoadingButton.propTypes = {
  children: PropTypes.string,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset'])
};

LoadingButton.defaultProps = {
  disabled: false,
  isLoading: false,
  type: 'button'
};

export default socrataTitleTipWrapper(LoadingButton);
