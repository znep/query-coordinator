import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import { Checkbox } from 'common/components';

import ColumnDropdown from '../ColumnDropdown';
import { toggleExcludeNullValues, setColumn } from '../../../actions/editor';

export class Count extends Component {

  // Left-hand pane with count-specific options.
  renderConfigPane() {
    const {
      columnFieldName,
      displayableFilterableColumns,
      excludeNullValues,
      measure,
      onSelectColumn,
      onToggleExcludeNullValues
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
        <div className="column-dropdown">
          <ColumnDropdown {...dropdownOptions} />
        </div>
        <Checkbox id="exclude-null-values" onChange={onToggleExcludeNullValues} checked={excludeNullValues}>
          {I18n.t('open_performance.measure.edit_modal.calculation.exclude_nulls')}
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
  excludeNullValues: PropTypes.bool.isRequired,
  measure: PropTypes.object,
  onToggleExcludeNullValues: PropTypes.func.isRequired,
  onSelectColumn: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const columnFieldName = _.get(state, 'editor.measure.metric.arguments.column');
  const excludeNullValues = _.get(state, 'editor.measure.metric.arguments.excludeNullValues', false);
  const displayableFilterableColumns = _.get(state, 'editor.displayableFilterableColumns');

  return {
    columnFieldName,
    excludeNullValues,
    displayableFilterableColumns,
    measure: state.editor.measure
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onToggleExcludeNullValues: toggleExcludeNullValues,
    onSelectColumn: setColumn
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Count);
