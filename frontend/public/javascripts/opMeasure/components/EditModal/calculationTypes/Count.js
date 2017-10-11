import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import { Checkbox } from 'common/components';
import { toggleExcludeNullValues, setUnitLabel, setDecimalPlaces } from '../../../actions/editor';

import CalculationPreview from '../CalculationPreview';

export class Count extends Component {

  // Left-hand pane with count-specific options.
  renderConfigPane() {
    const { onToggleExcludeNullValues, excludeNullValues } = this.props;
    return (
      <div className="metric-config">
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.types.count.title')}
        </h5>
        <Checkbox id="exclude-null-values" onChange={onToggleExcludeNullValues} checked={excludeNullValues}>
          {I18n.t('open_performance.measure.edit_modal.calculation.types.count.exclude_nulls')}
        </Checkbox>
      </div>
    );
  }

  renderDefinitionText() {
    return (
      <div className="metric-definition-text">
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.types.count.help_title')}
        </h5>
        {I18n.t('open_performance.measure.edit_modal.calculation.types.count.help_body')}
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.formula')}
        </h5>
        <code>count <span className="column">
          [{I18n.t('open_performance.measure.edit_modal.calculation.column_placeholder')}]
        </span></code>
      </div>
    );
  }

  render() {
    return (<div className="metric-container">
      {this.renderConfigPane()}
      <CalculationPreview />
      {this.renderDefinitionText()}
    </div>);
  }
}

Count.propTypes = {
  decimalPlaces: PropTypes.number,
  excludeNullValues: PropTypes.bool.isRequired,
  onChangeDecimalPlaces: PropTypes.func.isRequired,
  onChangeUnitLabel: PropTypes.func.isRequired,
  onToggleExcludeNullValues: PropTypes.func.isRequired,
  unitLabel: PropTypes.string.isRequired
};

function mapStateToProps(state) {
  const excludeNullValues = _.get(state, 'editor.measure.metric.arguments.excludeNullValues', false);
  const unitLabel = _.get(state, 'editor.measure.metric.label', '');
  const decimalPlaces = _.get(state, 'editor.measure.metric.display.decimalPlaces', 0);

  return {
    excludeNullValues,
    unitLabel,
    decimalPlaces
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onToggleExcludeNullValues: toggleExcludeNullValues,
    onChangeUnitLabel: setUnitLabel,
    onChangeDecimalPlaces: setDecimalPlaces
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Count);
