import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';

import { setCalculationType, setUnitLabel, setDecimalPlaces } from '../../actions/editor';

import calculationTypes from './calculationTypes';
import { CalculationTypeNames } from '../../lib/constants';
import CalculationPreview from './CalculationPreview';

// Configuration panel for methods and analysis.
export class CalculationPanel extends Component {

  renderCalculatorTypeButtons() {
    const { hasDataSource, calculationType } = this.props;

    const isCount = calculationType === CalculationTypeNames.COUNT;
    const countButtonClassName = classNames({
      'btn': true,
      'btn-default': !isCount,
      'btn-primary': isCount,
      'count-calculation': true
    });

    const isSum = calculationType === CalculationTypeNames.SUM;
    const sumButtonClassName = classNames({
      'btn': true,
      'btn-default': !isSum,
      'btn-primary': isSum,
      'sum-calculation': true
    });

    const isRate = calculationType === CalculationTypeNames.RATE;
    const rateButtonClassName = classNames({
      'btn': true,
      'btn-default': !isRate,
      'btn-primary': isRate,
      'rate-calculation': true
    });

    const isRecentValue = calculationType === CalculationTypeNames.RECENT_VALUE;
    const recentValueButtonClassName = classNames({
      'btn': true,
      'btn-default': !isRecentValue,
      'btn-primary': isRecentValue,
      'recent-calculation': true
    });

    const calculationTypeButtonConfigs = [
      {
        classNames: countButtonClassName,
        disabled: !hasDataSource,
        onClick: () => this.props.onSetCalculationType(CalculationTypeNames.COUNT),
        label: I18n.t('open_performance.calculation_types.count')
      },
      {
        classNames: sumButtonClassName,
        disabled: !hasDataSource,
        onClick: () => this.props.onSetCalculationType(CalculationTypeNames.SUM),
        label: I18n.t('open_performance.calculation_types.sum')
      },
      {
        classNames: rateButtonClassName,
        disabled: !hasDataSource,
        onClick: () => this.props.onSetCalculationType(CalculationTypeNames.RATE),
        label: I18n.t('open_performance.calculation_types.rate')
      },
      {
        classNames: recentValueButtonClassName,
        disabled: !hasDataSource,
        onClick: () => this.props.onSetCalculationType(CalculationTypeNames.RECENT_VALUE),
        label: I18n.t('open_performance.calculation_types.recent_value')
      }
    ];

    return calculationTypeButtonConfigs.map((btn, index) =>
      <button
        type="button"
        key={index}
        className={btn.classNames}
        disabled={btn.disabled}
        onClick={btn.onClick}>
        {btn.label}
      </button>
    );
  }

  renderSpecificCalculator() {
    const { calculationType, hasDataSource } = this.props;

    if (hasDataSource) {
      switch (calculationType) {
        case CalculationTypeNames.COUNT:
          return (<calculationTypes.Count />);
        case CalculationTypeNames.SUM:
          return (<calculationTypes.Sum />);
        case CalculationTypeNames.RATE:
          return (<calculationTypes.Rate />);
        case CalculationTypeNames.RECENT_VALUE:
          return (<calculationTypes.RecentValue />);
        default:
          throw new Error(`Unknown calculation type: ${calculationType}`);
      }
    } else {
      return (
        <div className="no-data-source">
          <h2>
            {I18n.t('open_performance.measure.edit_modal.calculation.data_source_needed')}
          </h2>
        </div>
      );
    }
  }

  render() {
    return (
      <div>
        <h3 className="calculation-panel-title">
          {I18n.t('open_performance.measure.edit_modal.calculation.title')}
        </h3>
        <p className="calculation-panel-subtitle">
          {I18n.t('open_performance.measure.edit_modal.calculation.subtitle')}
        </p>
        <form onSubmit={(event) => event.preventDefault()}>
          <h5>{I18n.t('open_performance.measure.edit_modal.calculation.sample_result')}</h5>
          <CalculationPreview />
          <div className="calculation-type-selector btn-group">
            {this.renderCalculatorTypeButtons()}
          </div>
          {this.renderSpecificCalculator()}
        </form>
      </div>
    );
  }
}

CalculationPanel.propTypes = {
  calculationType: PropTypes.string,
  decimalPlaces: PropTypes.number,
  hasDataSource: PropTypes.bool.isRequired,
  onChangeDecimalPlaces: PropTypes.func.isRequired,
  onChangeUnitLabel: PropTypes.func.isRequired,
  onSetCalculationType: PropTypes.func.isRequired,
  unitLabel: PropTypes.string.isRequired
};

function mapStateToProps(state) {
  const calculationType = _.get(state, 'editor.measure.metricConfig.type');
  const decimalPlaces = _.get(state, 'editor.measure.metricConfig.display.decimalPlaces', 0);
  const hasDataSource = !!_.get(state, 'editor.measure.dataSourceLensUid');
  const unitLabel = _.get(state, 'editor.measure.metricConfig.label', '');

  return {
    calculationType,
    decimalPlaces,
    hasDataSource,
    unitLabel
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onChangeDecimalPlaces: setDecimalPlaces,
    onChangeUnitLabel: setUnitLabel,
    onSetCalculationType: setCalculationType
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CalculationPanel);
