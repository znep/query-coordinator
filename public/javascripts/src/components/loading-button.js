import socrataTitleTipWrapper from './socrata-title-tip-wrapper';
import { classNames } from './utils';
import React, { PropTypes } from 'react';

const LoadingButton = socrataTitleTipWrapper(React.createClass({
  propTypes: {
    children: PropTypes.string,
    disabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    type: PropTypes.oneOf(['button', 'submit', 'reset'])
  },
  getDefaultProps() {
    return {
      disabled: false,
      isLoading: false,
      type: 'button'
    };
  },
  render() {
    const { isLoading, children, disabled, ...props } = this.props;
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
        onClick={(event) => { if (disabled) { event.preventDefault(); }}}
        {...props}>
        <span style={labelStyle}>{children}</span>
        <span className="loading" style={spinnerStyle}></span>
      </button>
    );
  }
}));

export default LoadingButton;
