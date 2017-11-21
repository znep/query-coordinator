import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import ColumnDropdown from '../ColumnDropdown';
import { setColumn } from '../../../actions/editor';

export class Sum extends Component {
  // Left-hand pane with count-specific options.
  renderConfigPane() {
    const { columnFieldName, displayableFilterableColumns, measure, onSelectColumn } = this.props;

    const dropdownOptions = {
      columnFieldName,
      displayableFilterableColumns,
      id: 'sum-column',
      measure,
      measureArgument: 'valueColumn',
      onSelectColumn
    };

    return (
      <div className="metric-config">
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.types.sum.title')}
        </h5>
        <div className="column-dropdown">
          <ColumnDropdown {...dropdownOptions} />
        </div>
      </div>
    );
  }

  renderDefinitionText() {
    return (
      <div className="metric-definition-text">
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.types.sum.help_title')}
        </h5>
        {I18n.t('open_performance.measure.edit_modal.calculation.types.sum.help_body')}
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

Sum.propTypes = {
  columnFieldName: PropTypes.string,
  displayableFilterableColumns: PropTypes.arrayOf(PropTypes.shape({
    renderTypeName: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fieldName: PropTypes.string.isRequired
  })),
  measure: PropTypes.object,
  onSelectColumn: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const columnFieldName = _.get(state, 'editor.measure.metric.arguments.column');
  const displayableFilterableColumns = _.get(state, 'editor.displayableFilterableColumns');

  return {
    columnFieldName,
    displayableFilterableColumns,
    measure: state.editor.measure
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onSelectColumn: setColumn
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Sum);
