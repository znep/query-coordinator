import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import { Checkbox } from 'common/components';

import ColumnDropdown from '../ColumnDropdown';
import { toggleIncludeNullValues, setColumn } from '../../../actions/editor';

export class Count extends Component {

  // Left-hand pane with count-specific options.
  renderConfigPane() {
    const {
      columnFieldName,
      displayableFilterableColumns,
      includeNullValues,
      measure,
      onSelectColumn,
      onToggleIncludeNullValues
    } = this.props;

    const dropdownOptions = {
      columnFieldName,
      displayableFilterableColumns,
      id: 'count-column',
      measure,
      measureArgument: 'valueColumn',
      onSelectColumn
    };

    return (
      <div className="metric-config">
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.types.count.column_selector_title')}
        </h5>
        <div className="column-dropdown">
          <ColumnDropdown {...dropdownOptions} />
        </div>
        <Checkbox id="include-null-values" onChange={onToggleIncludeNullValues} checked={includeNullValues}>
          {I18n.t('open_performance.measure.edit_modal.calculation.include_nulls')}
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
      </div>
    );
  }

  render() {
    return (
      <div className="metric-container">
        {this.renderConfigPane()}
        {this.renderDefinitionText()}
      </div>
    );
  }
}

Count.propTypes = {
  columnFieldName: PropTypes.string,
  displayableFilterableColumns: PropTypes.arrayOf(PropTypes.shape({
    renderTypeName: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fieldName: PropTypes.string.isRequired
  })),
  includeNullValues: PropTypes.bool.isRequired,
  measure: PropTypes.object,
  onToggleIncludeNullValues: PropTypes.func.isRequired,
  onSelectColumn: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const columnFieldName = _.get(state, 'editor.measure.metricConfig.arguments.column');
  const includeNullValues = _.get(state, 'editor.measure.metricConfig.arguments.includeNullValues', true);
  const displayableFilterableColumns = _.get(state, 'editor.displayableFilterableColumns');

  return {
    columnFieldName,
    includeNullValues,
    displayableFilterableColumns,
    measure: state.editor.measure
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onToggleIncludeNullValues: toggleIncludeNullValues,
    onSelectColumn: setColumn
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Count);
