import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

class Button extends Component {
  static defaultProps = {
    busy: false,
    dark: false,
    disabled: false,
    inverse: false,
    size: 'default',
    transparent: false,
    variant: 'default'
  };

  static propTypes = {
    // Replaces the content with a spinner.
    // Note that the width of the button is not fixed - the spinner
    // is probably smaller than your original content. Perhaps
    // we want to make the button preserve its width in the future.
    busy: PropTypes.bool,

    // Optional additional class to apply when the button is disabled.
    // The class applied it:
    // btn-${buttonDisabledStyle}
    buttonDisabledStyle: PropTypes.string,

    className: PropTypes.string,

    // Controls the visual size of the button.
    size: PropTypes.oneOf(['lg', 'default', 'sm', 'xs']),

    // Controls how the variant colors are assigned to the button.
    // false: Solid colored background.
    // true: Light background.
    inverse: PropTypes.bool,

    // Applies a theme suitable for darker backgrounds. Takes precedence over `inverse`.
    dark: PropTypes.bool,

    // Applies a preset visual style to the button.
    variant: PropTypes.oneOf([
      'default', 'transparent', 'primary', 'alternate-1', 'alternate-2',
      'simple', 'warning', 'success', 'error'
    ]),

    disabled: PropTypes.bool,

    onClick: PropTypes.func
  };

  render() {
    const {
      busy,
      buttonDisabledStyle,
      children,
      className,
      dark,
      disabled,
      inverse,
      onClick,
      size,
      transparent,
      variant,
      ...props
    } = this.props;

    const onClickFiltered = function() {
      // Note that the inner <button> automatically handles the disabled case.
      if (!busy && onClick) {
        onClick.apply(this, arguments);
      }
    };

    const sizeClass = size === 'default' ? null : `btn-${size}`;
    const disabledStyle = (buttonDisabledStyle && disabled) ? `btn-disabled-${buttonDisabledStyle}` : null;

    const classes = classNames('btn', `btn-${variant}`, sizeClass, className, disabledStyle, {
      'btn-dark': dark === true,
      'btn-inverse': inverse === true && !dark,
      'btn-transparent': transparent === true,
      'btn-busy': busy === true
    });

    const spinnerClasses = classNames('spinner-default', `spinner-btn-${variant}`, {
      'spinner-dark': dark === true
    });


    return (
      <button type="button" disabled={disabled} className={classes} onClick={onClickFiltered} {...props}>
        <div className="btn-content" style={{ visibility: busy ? 'hidden' : 'visible' }}>{children}</div>
        {busy && (
          <div className="spinner-container">
            <span className={spinnerClasses} />
          </div>
        )}
      </button>
    );
  }
}

export default Button;
