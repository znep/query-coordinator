import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators, compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';
import { CalculationTypeNames, EditTabs } from 'common/performance_measures/lib/constants';
import withComputedMeasure from 'common/performance_measures/components/withComputedMeasure';
import computedMeasurePropType from 'common/performance_measures/propTypes/computedMeasurePropType';

import {
  setDateColumn,
  setActivePanel,
  setCalculationType,
  setUnitLabel,
  setDecimalPlaces
} from '../../actions/editor';

import calculationTypes from './calculationTypes';
import ColumnDropdown from './ColumnDropdown';
import CalculationPreview from './CalculationPreview';

const i18nOptions = {
  scope: 'open_performance.measure.edit_modal'
};

// Configuration panel for methods and analysis.
export class CalculationPanel extends Component {

  renderCalculatorTypeButtons() {
    const { computedMeasure, calculationType, onSetCalculationType } = this.props;

    const {
      dataSourceNotConfigured,
      noReportingPeriodConfigured
    } = _.get(computedMeasure, 'errors', {});

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
            disabled={dataSourceNotConfigured || noReportingPeriodConfigured}
            onClick={() => onSetCalculationType(type)}>
            {I18n.t(`open_performance.calculation_types.${type}`)}
          </button>
        );
      }
    );
  }

  renderConfigLinks() {
    const { computedMeasure, openDataSourceTab, openReportingPeriodTab } = this.props;

    const {
      dataSourceNotConfigured,
      noReportingPeriodConfigured
    } = _.get(computedMeasure, 'errors', {});

    const dataLink = (
      <button
        className="btn btn-inverse btn-primary"
        onClick={openDataSourceTab}>
        {I18n.t('select_dataset', i18nOptions)}
      </button>
    );

    const periodLink = (
      <button
        className="btn btn-inverse btn-primary"
        onClick={openReportingPeriodTab}>
        {I18n.t('set_reporting_period', i18nOptions)}
      </button>
    );

    return (
      <div className="config-links">
        <div className="centerbox">
          <h2>
            {I18n.t('calculation.not_ready', i18nOptions)}
          </h2>
          {dataSourceNotConfigured && dataLink}
          {noReportingPeriodConfigured && periodLink}
        </div>
      </div>
    );
  }

  renderDateColumnChooser() {
    const {
      dateColumnFieldName,
      displayableFilterableColumns,
      measure,
      onSelectDateColumn
    } = this.props;

    const dateColDropdownOptions = {
      columnFieldName: dateColumnFieldName,
      displayableFilterableColumns,
      labelledBy: 'date-column',
      measure,
      measureArgument: 'dateColumn',
      onSelectColumn: onSelectDateColumn
    };

    return (
      <div className="calculation-panel-reference-date">
        <h5>
          {I18n.t('calculation.reference_date_column_title', i18nOptions)}
        </h5>
        <label className="block-label" id={dateColDropdownOptions.labelledBy}>
          {I18n.t('calculation.reference_date_column_subtitle', i18nOptions)}
        </label>
        <ColumnDropdown {...dateColDropdownOptions} />
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
    const { computedMeasure } = this.props;

    const {
      dataSourceNotConfigured,
      noReportingPeriodConfigured
    } = _.get(computedMeasure, 'errors', {});

    const isReady = computedMeasure && !dataSourceNotConfigured && !noReportingPeriodConfigured;

    const configLinks = !isReady ? this.renderConfigLinks() : null;
    const preview = isReady ? <CalculationPreview /> : null;
    const cover = !isReady ? (
      <div
        className="cover"
        title={I18n.t('calculation.not_ready', i18nOptions)} />
    ) : null;

    return (
      <div>
        <h3 className="calculation-panel-title">
          {I18n.t('calculation.title', i18nOptions)}
        </h3>
        <p className="calculation-panel-subtitle">
          {I18n.t('calculation.subtitle', i18nOptions)}
        </p>
        {configLinks}
        <div className="calculation-panel-form">
          <form onSubmit={(event) => event.preventDefault()}>
            {preview}
            <div className="calculation-type-selector btn-group">
              {this.renderCalculatorTypeButtons()}
            </div>
            {this.renderDateColumnChooser()}
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
  computedMeasure: computedMeasurePropType,
  dateColumnFieldName: PropTypes.string,
  decimalPlaces: PropTypes.number,
  displayableFilterableColumns: PropTypes.arrayOf(PropTypes.shape({
    renderTypeName: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fieldName: PropTypes.string.isRequired
  })),
  measure: PropTypes.object.isRequired,
  onChangeDecimalPlaces: PropTypes.func.isRequired,
  onChangeUnitLabel: PropTypes.func.isRequired,
  onSelectDateColumn: PropTypes.func.isRequired,
  onSetCalculationType: PropTypes.func.isRequired,
  openDataSourceTab: PropTypes.func.isRequired,
  openReportingPeriodTab: PropTypes.func.isRequired,
  unitLabel: PropTypes.string
};

function mapStateToProps(state) {
  const calculationType = _.get(state, 'editor.measure.metricConfig.type');
  const decimalPlaces = _.get(state, 'editor.measure.metricConfig.display.decimalPlaces', 0);
  const unitLabel = _.get(state, 'editor.measure.metricConfig.label', '');

  const dateColumnFieldName = _.get(state, 'editor.measure.metricConfig.dateColumn');
  const displayableFilterableColumns = _.get(state, 'editor.displayableFilterableColumns');

  return {
    calculationType,
    dateColumnFieldName,
    decimalPlaces,
    displayableFilterableColumns,
    measure: state.editor.measure,
    unitLabel
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onSelectDateColumn: setDateColumn,
    onChangeDecimalPlaces: setDecimalPlaces,
    onChangeUnitLabel: setUnitLabel,
    onSetCalculationType: setCalculationType,
    openDataSourceTab: () => setActivePanel(EditTabs.DATA_SOURCE),
    openReportingPeriodTab: () => setActivePanel(EditTabs.REPORTING_PERIOD)
  }, dispatch);
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withComputedMeasure()
)(CalculationPanel);
