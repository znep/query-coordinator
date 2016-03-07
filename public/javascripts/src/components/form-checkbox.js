import React, { PropTypes } from 'react';

const FormCheckbox = React.createClass({
  propTypes: {
    action: PropTypes.string.isRequired,
    authenticityToken: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    disabled: PropTypes.bool,
    method: PropTypes.string.isRequired,
    onSuccess: PropTypes.func,
    title: PropTypes.string
  },
  getDefaultProps() {
    return {
      disabled: false,
      onSuccess: _.noop,
      title: null
    };
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
          title={title}>
          { !disabled ? <span className={`icon-check ${checkedClass}`}></span> : null }
        </span>
      </form>
    );
  }
});

export default FormCheckbox;
