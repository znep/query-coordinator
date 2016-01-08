import { classNames } from './utils';
import React, { PropTypes } from 'react';

const FormControls = React.createClass({
  propTypes: {
    cancelLabel: PropTypes.string,
    onCancel: PropTypes.func,
    onSave: PropTypes.func,
    onBack: PropTypes.func,
    saveDisabled: PropTypes.bool,
    saveLabel: PropTypes.string
  },
  getDefaultProps() {
    return {
      saveDisabled: false
    };
  },
  renderButton(handlerName, label, disabled) {
    if (!_.isUndefined(this.props[handlerName])) {
      const className = classNames('button', { disabled });
      return (
        <button
          className={className}
          disabled={disabled}
          onClick={ () => { this.props[handlerName](); } }
          type="button"
          >
          {label}
        </button>
      );
    }
  },
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
});

export default FormControls;
