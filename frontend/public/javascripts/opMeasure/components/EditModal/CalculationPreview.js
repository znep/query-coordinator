import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';

import { setUnitLabel, setDecimalPlaces } from '../../actions/editor';

import EditedMeasureResultCard from '../EditedMeasureResultCard';

// Right hand preview and display options for calculation
export class CalculationPreview extends Component {
  render() {
    const { onChangeUnitLabel, unitLabel, onChangeDecimalPlaces, decimalPlaces } = this.props;

    const decimalPlacesId = 'metric_decimal_places';
    const decimalPlacesAttributes = {
      id: decimalPlacesId,
      step: 1,
      min: 0,
      className: 'text-input',
      type: 'number',
      onChange: (event) => onChangeDecimalPlaces(parseInt(event.target.value, 10)),
      value: decimalPlaces
    };

    const rowUnitId = 'metric_unit_label';
    const rowUnitAttributes = {
      id: rowUnitId,
      className: 'text-input',
      type: 'text',
      onChange: (event) => onChangeUnitLabel(event.target.value),
      placeholder: I18n.t(
        'open_performance.measure.edit_modal.calculation.display_options.unit_label_placeholder'
      ),
      value: unitLabel
    };

    return (
      <div className="metric-preview">
        {I18n.t('open_performance.measure.edit_modal.calculation.sample_result')}
        <EditedMeasureResultCard />
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.display_options.title')}
        </h5>
        <label htmlFor={decimalPlacesId}>
          {I18n.t('open_performance.measure.edit_modal.calculation.display_options.decimal_places')}
        </label>
        <input {...decimalPlacesAttributes} />
        <label htmlFor={rowUnitId}>
          {I18n.t('open_performance.measure.edit_modal.calculation.display_options.unit_label')}
        </label>
        <input {...rowUnitAttributes} />
      </div>
    );
  }
}

CalculationPreview.propTypes = {
  decimalPlaces: PropTypes.number,
  onChangeDecimalPlaces: PropTypes.func.isRequired,
  onChangeUnitLabel: PropTypes.func.isRequired,
  unitLabel: PropTypes.string.isRequired
};

export function mapStateToProps(state) {
  const unitLabel = _.get(state, 'editor.measure.metric.display.label', '');
  const decimalPlaces = _.get(state, 'editor.measure.metric.display.decimalPlaces', 0);

  return {
    unitLabel,
    decimalPlaces
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onChangeUnitLabel: setUnitLabel,
    onChangeDecimalPlaces: setDecimalPlaces
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CalculationPreview);
