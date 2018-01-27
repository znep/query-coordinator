import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';
import { CalculationTypeNames, EditTabs } from 'common/performance_measures/lib/constants';

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
            {I18n.t('calculation.data_source_needed', i18nOptions)}
          </h2>
          <button
            className="btn btn-inverse btn-primary"
            onClick={openDataSourceTab}>
            {I18n.t('select_dataset', i18nOptions)}
          </button>
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
    const { hasDataSource } = this.props;

    const dataLink = !hasDataSource ? this.renderNoData() : null;
    const preview = hasDataSource ? <CalculationPreview /> : null;
    const cover = !hasDataSource ? (
      <div
        className="cover"
        title={I18n.t('calculation.data_source_needed', i18nOptions)} />
    ) : null;

    return (
      <div>
        <h3 className="calculation-panel-title">
          {I18n.t('calculation.title', i18nOptions)}
        </h3>
        <p className="calculation-panel-subtitle">
          {I18n.t('calculation.subtitle', i18nOptions)}
        </p>
        {dataLink}
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
  dateColumnFieldName: PropTypes.string,
  decimalPlaces: PropTypes.number,
  displayableFilterableColumns: PropTypes.arrayOf(PropTypes.shape({
    renderTypeName: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fieldName: PropTypes.string.isRequired
  })),
  hasDataSource: PropTypes.bool.isRequired,
  measure: PropTypes.object.isRequired,
  onChangeDecimalPlaces: PropTypes.func.isRequired,
  onChangeUnitLabel: PropTypes.func.isRequired,
  onSelectDateColumn: PropTypes.func.isRequired,
  onSetCalculationType: PropTypes.func.isRequired,
  openDataSourceTab: PropTypes.func.isRequired,
  unitLabel: PropTypes.string
};

function mapStateToProps(state) {
  const calculationType = _.get(state, 'editor.measure.metricConfig.type');
  const decimalPlaces = _.get(state, 'editor.measure.metricConfig.display.decimalPlaces', 0);
  const hasDataSource = !!_.get(state, 'editor.measure.dataSourceLensUid');
  const unitLabel = _.get(state, 'editor.measure.metricConfig.label', '');

  const dateColumnFieldName = _.get(state, 'editor.measure.metricConfig.dateColumn');
  const displayableFilterableColumns = _.get(state, 'editor.displayableFilterableColumns');

  return {
    calculationType,
    dateColumnFieldName,
    decimalPlaces,
    displayableFilterableColumns,
    hasDataSource,
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
    openDataSourceTab: () => setActivePanel(EditTabs.DATA_SOURCE)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CalculationPanel);
