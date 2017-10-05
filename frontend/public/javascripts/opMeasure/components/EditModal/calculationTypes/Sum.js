import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import { Dropdown, SocrataIcon } from 'common/components';
import { setUnitLabel, setDecimalPlaces, setColumn } from '../../../actions/editor';

import CalculationPreview from '../CalculationPreview';

export class Sum extends Component {
  // Left-hand pane with count-specific options.
  renderConfigPane() {
    const { displayableFilterableColumns } = this.props;

    const dropdownOptions = {
      placeholder: I18n.t('open_performance.measure.edit_modal.calculation.choose_column'),
      onSelection: (option) => {
        this.props.onSelectColumn(option.value);
      },
      options: _.filter(displayableFilterableColumns, { renderTypeName: 'number' }).map(numberCol => ({
        title: numberCol.name,
        value: numberCol.fieldName,
        icon: <SocrataIcon name="number" />
      })),
      value: this.props.columnFieldName
    };

    return (
      <div className="metric-config">
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.types.sum.title')}
        </h5>
        <div className="column-dropdown">
          <Dropdown {...dropdownOptions} />
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
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.formula')}
        </h5>
        <code>sum <span className="column">
          [{I18n.t('open_performance.measure.edit_modal.calculation.column_placeholder')}]
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

Sum.propTypes = {
  columnFieldName: PropTypes.string,
  dataSourceViewMetadata: PropTypes.shape({
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        renderTypeName: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      }).isRequired
    )
  }),
  decimalPlaces: PropTypes.number,
  displayableFilterableColumns: PropTypes.array,
  onChangeDecimalPlaces: PropTypes.func.isRequired,
  onChangeUnitLabel: PropTypes.func.isRequired,
  onSelectColumn: PropTypes.func.isRequired,
  unitLabel: PropTypes.string.isRequired
};

function mapStateToProps(state) {
  const columnFieldName = _.get(state, 'editor.measure.metric.arguments.column');
  const dataSourceViewMetadata = _.get(state, 'editor.dataSourceViewMetadata');
  const decimalPlaces = _.get(state, 'editor.measure.metric.display.decimalPlaces', 0);
  const displayableFilterableColumns = _.get(state, 'editor.displayableFilterableColumns');
  const unitLabel = _.get(state, 'editor.measure.metric.label', '');

  return {
    columnFieldName,
    dataSourceViewMetadata,
    decimalPlaces,
    displayableFilterableColumns,
    unitLabel
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onChangeDecimalPlaces: setDecimalPlaces,
    onChangeUnitLabel: setUnitLabel,
    onSelectColumn: setColumn
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Sum);
