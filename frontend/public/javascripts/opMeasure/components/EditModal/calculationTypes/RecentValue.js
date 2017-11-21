import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import ColumnDropdown from '../ColumnDropdown';
import { setValueColumn, setDateColumn } from '../../../actions/editor';

export class RecentValue extends Component {
  // Left-hand pane with count-specific options.
  renderConfigPane() {
    const {
      dateColumnFieldName,
      displayableFilterableColumns,
      measure,
      onSelectDateColumn,
      onSelectValueColumn,
      valueColumnFieldName
    } = this.props;

    const valueColDropdownOptions = {
      columnFieldName: valueColumnFieldName,
      displayableFilterableColumns,
      labelledBy: 'value-column',
      measure,
      measureArgument: 'valueColumn',
      onSelectColumn: onSelectValueColumn
    };

    const dateColDropdownOptions = {
      columnFieldName: dateColumnFieldName,
      displayableFilterableColumns,
      labelledBy: 'date-column',
      measure,
      measureArgument: 'dateColumn',
      onSelectColumn: onSelectDateColumn
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
          <ColumnDropdown {...valueColDropdownOptions} />
          <label className="block-label" id={dateColDropdownOptions.labelledBy}>
            {I18n.t('open_performance.measure.edit_modal.calculation.types.recent_value.date_column')}
          </label>
          <ColumnDropdown {...dateColDropdownOptions} />
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
      </div>
    );
  }

  render() {
    return (<div className="metric-container">
      {this.renderConfigPane()}
      {this.renderDefinitionText()}
    </div>);
  }
}

RecentValue.propTypes = {
  dateColumnFieldName: PropTypes.string,
  displayableFilterableColumns: PropTypes.arrayOf(PropTypes.shape({
    renderTypeName: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fieldName: PropTypes.string.isRequired
  })),
  measure: PropTypes.object.isRequired,
  onSelectDateColumn: PropTypes.func.isRequired,
  onSelectValueColumn: PropTypes.func.isRequired,
  valueColumnFieldName: PropTypes.string
};

function mapStateToProps(state) {
  const dateColumnFieldName = _.get(state, 'editor.measure.metric.arguments.dateColumn');
  const displayableFilterableColumns = _.get(state, 'editor.displayableFilterableColumns');
  const valueColumnFieldName = _.get(state, 'editor.measure.metric.arguments.valueColumn');

  return {
    dateColumnFieldName,
    displayableFilterableColumns,
    measure: state.editor.measure,
    valueColumnFieldName
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onSelectDateColumn: setDateColumn,
    onSelectValueColumn: setValueColumn
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RecentValue);
