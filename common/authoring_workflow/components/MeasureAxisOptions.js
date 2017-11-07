import _ from 'lodash';
import classNames from 'classnames';
import { connect } from 'react-redux';
import I18n from 'common/i18n';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import DebouncedInput from './shared/DebouncedInput';

export class MeasureAxisOptions extends Component {
  renderRadioButton({ checked, className, disabled, id, label, onChange, value }) {
    const inputAttributes = {
      checked,
      disabled,
      id,
      onChange,
      name: 'measure-axis-scale',
      type: 'radio',
      value
    };

    return (
      <div className={className}>
        <input {...inputAttributes} />
        <label htmlFor={id}>
          <span className="fake-radiobutton" />
          <div className="translation-within-label">{label}</div>
        </label>
      </div>
    );
  }

  renderTextboxes() {
    const {
      disabled,
      maxLimit,
      minLimit,
      onMaxValueTextboxChange,
      onMinValueTextboxChange
    } = this.props;

    const maxValueTextbox = this.renderTextbox({
      disabled,
      id: 'measure-axis-scale-custom-max',
      label: I18n.t('shared.visualizations.panes.axis_and_scale.fields.scale.maximum'),
      onChange: onMaxValueTextboxChange,
      value: maxLimit
    });

    const minValueTextbox = this.renderTextbox({
      disabled,
      id: 'measure-axis-scale-custom-min',
      label: I18n.t('shared.visualizations.panes.axis_and_scale.fields.scale.minimum'),
      onChange: onMinValueTextboxChange,
      value: minLimit
    });

    return (
      <div className="double-column-input-group">
        {minValueTextbox}
        {maxValueTextbox}
      </div>
    );
  }

  renderTextbox({ disabled, id, label, onChange, value }) {
    const labelAttributes = {
      className: 'block-label',
      htmlFor: 'id'
    };

    const inputAttributes = {
      className: 'text-input',
      disabled,
      id,
      onChange,
      type: 'number',
      value
    };

    return (
      <div>
        <label {...labelAttributes}>{label}</label>
        <DebouncedInput {...inputAttributes} />
      </div>
    );
  }

  render() {
    const {
      disabled,
      isAutomatic,
      onRadioButtonChange
    } = this.props;

    const className = classNames('authoring-field radiobutton', {
      'disabled': disabled
    });

    const automaticRadioButton = this.renderRadioButton({
      checked: isAutomatic,
      className: 'measure-axis-scale-automatic-container',
      disabled,
      id: 'measure-axis-scale-automatic',
      label: I18n.t('shared.visualizations.panes.axis_and_scale.fields.scale.automatic'),
      onChange: onRadioButtonChange,
      value: 'automatic'
    });

    const customRadioButton = this.renderRadioButton({
      checked: !isAutomatic,
      className: 'measure-axis-scale-custom-container',
      disabled,
      id: 'measure-axis-scale-custom',
      label: I18n.t('shared.visualizations.panes.axis_and_scale.fields.scale.custom'),
      onChange: onRadioButtonChange,
      value: 'custom'
    });

    const textboxes = isAutomatic ? null : this.renderTextboxes();

    return (
      <div>
        <div className={className}>
          {automaticRadioButton}
          {customRadioButton}
        </div>
        {textboxes}
      </div>
    );
  }
}

MeasureAxisOptions.propTypes = {
  disabled: PropTypes.bool,
  isAutomatic: PropTypes.bool,
  key: PropTypes.number,
  maxLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  minLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onMaxValueTextboxChange: PropTypes.func,
  onMinValueTextboxChange: PropTypes.func,
  onRadioButtonChange: PropTypes.func
};

export default connect()(MeasureAxisOptions);
