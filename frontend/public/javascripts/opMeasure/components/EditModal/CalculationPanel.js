import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';

import { setActivePanel, setCalculationType, setUnitLabel, setDecimalPlaces } from '../../actions/editor';

import calculationTypes from './calculationTypes';
import { CalculationTypeNames, EditTabs } from '../../lib/constants';
import CalculationPreview from './CalculationPreview';

// Configuration panel for methods and analysis.
export class CalculationPanel extends Component {

  renderCalculatorTypeButtons() {
    const { hasDataSource, calculationType, onSetCalculationType } = this.props;

    return Object.keys(CalculationTypeNames).
      map(key => CalculationTypeNames[key]).
      map((type, index) => {
        const isCurrentType = calculationType === type;
        const className = classNames({
          'btn': true,
          'btn-default': !isCurrentType,
          'btn-primary': isCurrentType,
          [`${type}-calculation`]: true
        });

        return (
          <button
            type="button"
            key={index}
            className={className}
            disabled={!hasDataSource}
            onClick={() => onSetCalculationType(type)}>
            {I18n.t(`open_performance.calculation_types.${type}`)}
          </button>
        );
      }
    );
  }

  renderNoData() {
    const { openDataSourceTab } = this.props;

    return (
      <div className="no-data-source">
        <div className="centerbox">
          <h2>
            {I18n.t('open_performance.measure.edit_modal.calculation.data_source_needed')}
          </h2>
          <button
            className="btn btn-inverse btn-primary"
            onClick={openDataSourceTab}>
            {I18n.t('open_performance.measure.edit_modal.select_dataset')}
          </button>
        </div>
      </div>
    );
  }

  renderSpecificCalculator() {
    const { calculationType } = this.props;

    switch (calculationType) {
      case CalculationTypeNames.COUNT:
        return (<calculationTypes.Count />);
      case CalculationTypeNames.SUM:
        return (<calculationTypes.Sum />);
      case CalculationTypeNames.RATE:
        return (<calculationTypes.Rate />);
      case CalculationTypeNames.RECENT:
        return (<calculationTypes.RecentValue />);
      default:
        throw new Error(`Unknown calculation type: ${calculationType}`);
    }
  }

  render() {
    const { hasDataSource } = this.props;

    const dataLink = !hasDataSource ? this.renderNoData() : null;
    const preview = hasDataSource ? <CalculationPreview /> : null;
    const cover = !hasDataSource ? (
      <div
        className="cover"
        title={I18n.t('open_performance.measure.edit_modal.calculation.data_source_needed')} />
    ) : null;

    return (
      <div>
        <h3 className="calculation-panel-title">
          {I18n.t('open_performance.measure.edit_modal.calculation.title')}
        </h3>
        <p className="calculation-panel-subtitle">
          {I18n.t('open_performance.measure.edit_modal.calculation.subtitle')}
        </p>
        {dataLink}
        <div className="calculation-panel-form">
          <form onSubmit={(event) => event.preventDefault()}>
            {preview}
            <div className="calculation-type-selector btn-group">
              {this.renderCalculatorTypeButtons()}
            </div>
            {this.renderSpecificCalculator()}
          </form>
          {cover}
        </div>
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
  openDataSourceTab: PropTypes.func.isRequired,
  unitLabel: PropTypes.string
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
    onSetCalculationType: setCalculationType,
    openDataSourceTab: () => setActivePanel(EditTabs.DATA_SOURCE)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CalculationPanel);
