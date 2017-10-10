import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import { Dropdown, SocrataIcon } from 'common/components';
import { setUnitLabel, setDecimalPlaces, setValueColumn, setDateColumn } from '../../../actions/editor';

import CalculationPreview from '../CalculationPreview';

export class RecentValue extends Component {
  // Left-hand pane with count-specific options.
  renderConfigPane() {
    const { displayableFilterableColumns } = this.props;

    const valueColDropdownOptions = {
      placeholder: I18n.t('open_performance.measure.edit_modal.calculation.choose_column'),
      onSelection: (option) => {
        this.props.onSelectValueColumn(option.value);
      },
      options: _.filter(displayableFilterableColumns, { renderTypeName: 'number' }).map(numberCol => ({
        title: numberCol.name,
        value: numberCol.fieldName,
        icon: <SocrataIcon name="number" />
      })),
      value: this.props.valueColumnFieldName,
      labelledBy: 'value-column'
    };

    const dateColDropdownOptions = {
      placeholder: I18n.t('open_performance.measure.edit_modal.calculation.choose_column'),
      onSelection: (option) => {
        this.props.onSelectDateColumn(option.value);
      },
      options: _.filter(displayableFilterableColumns, { renderTypeName: 'calendar_date' }).map(numberCol => ({
        title: numberCol.name,
        value: numberCol.fieldName,
        icon: <SocrataIcon name="date" />
      })),
      value: this.props.dateColumnFieldName,
      labelledBy: 'date-column'
    };

    return (
      <div className="metric-config">
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.types.recent_value.title')}
        </h5>
        <div className="column-dropdown">
          <label className="block-label" id={valueColDropdownOptions.labelledBy}>
            {I18n.t('open_performance.measure.edit_modal.calculation.types.recent_value.value_column')}
          </label>
          <Dropdown {...valueColDropdownOptions} />
          <label className="block-label" id={dateColDropdownOptions.labelledBy}>
            {I18n.t('open_performance.measure.edit_modal.calculation.types.recent_value.date_column')}
          </label>
          <Dropdown {...dateColDropdownOptions} />
        </div>
      </div>
    );
  }

  renderDefinitionText() {
    return (
      <div className="metric-definition-text">
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.types.recent_value.help_title')}
        </h5>
        {I18n.t('open_performance.measure.edit_modal.calculation.types.recent_value.help_body')}
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.formula')}
        </h5>
        <code><span className="column">
          [{I18n.t('open_performance.measure.edit_modal.calculation.column_placeholder')} a],
          [{I18n.t('open_performance.measure.edit_modal.calculation.row_placeholder')} a]
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

RecentValue.propTypes = {
  dateColumnFieldName: PropTypes.string,
  decimalPlaces: PropTypes.number,
  displayableFilterableColumns: PropTypes.arrayOf(PropTypes.shape({
    renderTypeName: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fieldName: PropTypes.string.isRequired
  })),
  onChangeDecimalPlaces: PropTypes.func.isRequired,
  onChangeUnitLabel: PropTypes.func.isRequired,
  onSelectDateColumn: PropTypes.func.isRequired,
  onSelectValueColumn: PropTypes.func.isRequired,
  unitLabel: PropTypes.string.isRequired,
  valueColumnFieldName: PropTypes.string
};

function mapStateToProps(state) {
  const dateColumnFieldName = _.get(state, 'editor.measure.metric.arguments.dateColumn');
  const decimalPlaces = _.get(state, 'editor.measure.metric.display.decimalPlaces', 0);
  const displayableFilterableColumns = _.get(state, 'editor.displayableFilterableColumns');
  const valueColumnFieldName = _.get(state, 'editor.measure.metric.arguments.valueColumn');
  const unitLabel = _.get(state, 'editor.measure.metric.label', '');

  return {
    decimalPlaces,
    dateColumnFieldName,
    displayableFilterableColumns,
    valueColumnFieldName,
    unitLabel
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onChangeDecimalPlaces: setDecimalPlaces,
    onChangeUnitLabel: setUnitLabel,
    onSelectDateColumn: setDateColumn,
    onSelectValueColumn: setValueColumn
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RecentValue);
