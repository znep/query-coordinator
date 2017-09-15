import { classNames } from './utils';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

class FormControls extends Component {
  renderButton(handlerName, label, disabled) {
    if (!_.isUndefined(this.props[handlerName])) {
      const className = classNames('button', { disabled });
      return (
        <button
          className={className}
          disabled={disabled}
          onClick={() => { this.props[handlerName](); }}
          type="button">
          {label}
        </button>
      );
    }
  }
  render() {
    const {
      cancelLabel,
      saveLabel,
      saveDisabled
    } = this.props;

    return (
      <div className="line clearfix form-controls">
        {this.renderButton('onCancel', cancelLabel || $.t('core.dialogs.cancel'))}
        {this.renderButton('onSave', saveLabel || $.t('core.dialogs.save'), saveDisabled)}
      </div>
    );
  }
}

FormControls.propTypes = {
  cancelLabel: PropTypes.string,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  onBack: PropTypes.func,
  saveDisabled: PropTypes.bool,
  saveLabel: PropTypes.string
};

FormControls.defaultProps = {
  saveDisabled: false
};

export default FormControls;
