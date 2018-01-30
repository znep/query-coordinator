import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import { Checkbox } from 'common/components';
import MeasureResultCard from 'common/performance_measures/components/MeasureResultCard';
import { CalculationTypeNames } from 'common/performance_measures/lib/constants';

import { setUnitLabel, setDecimalPlaces, toggleDisplayAsPercent } from '../../actions/editor';

// Right hand preview and display options for calculation
export class CalculationPreview extends Component {
  renderDisplayAsPercent() {
    const {
      calculationType,
      displayAsPercent,
      onToggleDisplayAsPercent
    } = this.props;

    if (calculationType !== CalculationTypeNames.RATE) {
      return null;
    }

    const displayAsPercentId = 'metric_display_as_percent';
    const displayAsPercentAttributes = {
      id: displayAsPercentId,
      onChange: onToggleDisplayAsPercent,
      checked: displayAsPercent
    };

    return (
      <div className="metric-display-as-percent">
        <Checkbox {...displayAsPercentAttributes} >
          {I18n.t('open_performance.measure.edit_modal.calculation.display_options.display_as_percent')}
        </Checkbox>
      </div>
    );
  }

  render() {
    const {
      onChangeUnitLabel,
      unitLabel,
      onChangeDecimalPlaces,
      decimalPlaces,
      measure
    } = this.props;

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
        <h5>{I18n.t('open_performance.measure.edit_modal.calculation.sample_result')}</h5>
        <MeasureResultCard measure={measure} />
        <div className="metric-display-options">
          <h6 className="metric-display-options-title">
            {I18n.t('open_performance.measure.edit_modal.calculation.display_options.title')}
          </h6>
          <div className="metric-decimal-places">
            <label htmlFor={decimalPlacesId}>
              {I18n.t('open_performance.measure.edit_modal.calculation.display_options.decimal_places')}
            </label>
            <input {...decimalPlacesAttributes} />
          </div>
          <div className="metric-unit-label">
            <label htmlFor={rowUnitId}>
              {I18n.t('open_performance.measure.edit_modal.calculation.display_options.unit_label')}
            </label>
            <input {...rowUnitAttributes} />
          </div>
          {this.renderDisplayAsPercent()}
        </div>
      </div>
    );
  }
}

CalculationPreview.defaultProps = {
  unitLabel: '',
  onToggleDisplayAsPercent: _.noop,
  onChangeUnitLabel: _.noop,
  onChangeDecimalPlaces: _.noop,
  displayAsPercent: false
};

CalculationPreview.propTypes = {
  calculationType: PropTypes.string,
  decimalPlaces: PropTypes.number,
  displayAsPercent: PropTypes.bool,
  onChangeDecimalPlaces: PropTypes.func,
  onChangeUnitLabel: PropTypes.func,
  onToggleDisplayAsPercent: PropTypes.func,
  unitLabel: PropTypes.string,
  measure: PropTypes.object.isRequired // TODO measurePropType, see MeasureResultCard
};

export function mapStateToProps(state) {
  const { measure } = state.editor;
  const calculationType = _.get(measure, 'metricConfig.type');
  const decimalPlaces = _.get(measure, 'metricConfig.display.decimalPlaces', 0);
  const displayAsPercent = _.get(measure, 'metricConfig.display.asPercent', false);
  const unitLabel = _.get(measure, 'metricConfig.display.label', '');

  return {
    calculationType,
    decimalPlaces,
    displayAsPercent,
    unitLabel,
    measure
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onChangeUnitLabel: setUnitLabel,
    onChangeDecimalPlaces: setDecimalPlaces,
    onToggleDisplayAsPercent: toggleDisplayAsPercent
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CalculationPreview);
