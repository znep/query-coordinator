import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';

import { setCalculationType } from '../../actions/editor';

import calculationTypes from './calculationTypes';
import { CalculationTypeNames } from '../../lib/constants';

// Configuration panel for methods and analysis.
export class CalculationPanel extends Component {

  renderCalculatorTypeButtons() {
    const { hasDataSource, calculationType } = this.props;

    const isCount = calculationType === CalculationTypeNames.COUNT;
    const countButtonClassName = classNames({
      'btn': true,
      'btn-default': true,
      'btn-primary': isCount,
      'count-calculation': true
    });

    const isSum = calculationType === CalculationTypeNames.SUM;
    const sumButtonClassName = classNames({
      'btn': true,
      'btn-default': true,
      'btn-primary': isSum,
      'sum-calculation': true
    });

    const isRecentValue = calculationType === CalculationTypeNames.RECENT_VALUE;
    const recentValueButtonClassName = classNames({
      'btn': true,
      'btn-default': true,
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
        classNames: recentValueButtonClassName,
        disabled: !hasDataSource,
        onClick: () => this.props.onSetCalculationType(CalculationTypeNames.RECENT_VALUE),
        label: I18n.t('open_performance.calculation_types.recent_value')
      }
    ];

    return calculationTypeButtonConfigs.map((btn, index) =>
      <button
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
        case CalculationTypeNames.RECENT_VALUE:
          return (<calculationTypes.RecentValue />);
        default:
          throw new Error(`Unknown calculation type: ${calculationType}`);
      }
    } else {
      return (<div className="no-data-source">
        <h2>
          {I18n.t('open_performance.measure.edit_modal.calculation.data_source_needed')}
        </h2>
      </div>);
    }
  }

  render() {
    return (
      <div>
        <h3>
          {I18n.t('open_performance.measure.edit_modal.calculation.title')}
        </h3>
        <p>
          {I18n.t('open_performance.measure.edit_modal.calculation.subtitle')}
        </p>
        <form onSubmit={(event) => event.preventDefault()}>
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
  hasDataSource: PropTypes.bool.isRequired,
  calculationType: PropTypes.string,
  onSetCalculationType: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  return {
    hasDataSource: !!_.get(state, 'editor.measure.metric.dataSource.uid'),
    calculationType: _.get(state, 'editor.measure.metric.type')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onSetCalculationType: setCalculationType
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CalculationPanel);
