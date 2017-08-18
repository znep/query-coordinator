import React, { Component, PropTypes } from 'react';
import cx from 'classnames';

class SocrataButton extends Component {
  render() {
    const {
      buttonType,
      buttonStyle,
      buttonDisabledStyle,
      buttonSize,
      children,
      className,
      ...props
    } = this.props;
    const classes = cx(
      'btn',
      {
        [`btn-${buttonType}`]: buttonType,
        [`btn-${buttonStyle}`]: buttonStyle,
        [`btn-${buttonSize}`]: buttonSize,
        [`btn-disabled-${buttonDisabledStyle}`]: buttonDisabledStyle && props.disabled
      },
      className
    );

    return (
      <button type="button" className={classes} {...props}>
        {children}
      </button>
    );
  }
}

SocrataButton.propTypes = {
  buttonType: PropTypes.oneOf([
    'default',
    'primary',
    'alternate-1',
    'alternate-2',
    'simple',
    'warning',
    'success',
    'error',
    'transparent'
  ]).isRequired,
  buttonStyle: PropTypes.oneOf(['inverse', 'block', 'dark', 'busy']),
  buttonSize: PropTypes.oneOf(['lg', 'sm', 'xs']),
  buttonDisabledStyle: PropTypes.oneOf(['light'])
};

export default SocrataButton;
