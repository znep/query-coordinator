import React, { PropTypes } from 'react';

const FormCheckbox = React.createClass({
  propTypes: {
    action: PropTypes.string,
    authenticityToken: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    disabled: PropTypes.bool,
    method: PropTypes.string.isRequired,
    onSuccess: PropTypes.func,
    title: PropTypes.string
  },
  getDefaultProps() {
    return {
      action: '',
      disabled: false,
      onSuccess: _.noop,
      title: null
    };
  },
  handleKeyPressSelect(event) {
    const keyCode = event.nativeEvent.keyCode;

    // Enter or Space key code
    if (keyCode === 13 || keyCode === 32) {
      this.handleSelect();
    }
  },
  handleSelect() {
    const {
      action,
      authenticityToken,
      disabled,
      method,
      onSuccess
    } = this.props;

    if (disabled) { return; }

    $.ajax({
      context: this,
      url: action,
      type: method,
      body: JSON.stringify({ authenticityToken }),
      dataType: 'json',
      success: onSuccess
    });
  },
  render() {
    const {
      checked,
      disabled,
      title
    } = this.props;

    const disabledClass = disabled ? 'disabled' : '';
    const checkedClass = checked ? '' : 'unchecked';

    return (
      <form>
        <span
          className={`form-checkbox ${disabledClass}`}
          onClick={this.handleSelect}
          onKeyPress={this.handleKeyPressSelect}
          role="checkbox"
          tabIndex="0"
          aria-checked={checked}
          aria-disabled={disabled}
          aria-label={title}
          title={title}>
          {!disabled ? <span className={`icon-check ${checkedClass}`}></span> : null}
        </span>
      </form>
    );
  }
});

export default FormCheckbox;
