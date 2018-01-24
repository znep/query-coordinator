import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import cssModules from 'react-css-modules';
import _ from 'lodash';

import I18n from 'common/i18n';
import DateRangePicker from 'common/components/DateRangePicker';
import Dropdown from 'common/components/Dropdown';

import {
  AGGREGATION_TYPES,
  LOCATION_COLUMN_TYPES,
  DATE_COLUMN_TYPES,
  STRING_COLUMN_TYPES
} from 'common/components/CreateAlertModal/constants';
import { aggregateOptions } from './helpers';
import styles from '../components.module.scss';


class SoqlSliceBuilder extends Component {
  state = {
    selectedDatasetColumn: {},
    selectedColumnValues: []
  };

  // sometimes components will mount with props(edit mode)
  componentWillMount() {
    this.setState({
      selectedDatasetColumn: this.getSelectedOption(this.props)
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      selectedDatasetColumn: this.getSelectedOption(nextProps)
    });
  }


  onSliceColumnChnange = (newSlice) => {
    const { slice, sliceIndex, onSliceValueChange } = this.props;
    // adding logical operator value on column change
    if (!_.isEmpty(slice.logical_operator)) {
      newSlice.logical_operator = slice.logical_operator;
    }
    // adding statemnt value on column change
    if (!_.isEmpty(slice.statement)) {
      newSlice.statement = slice.statement;
    }
    onSliceValueChange(newSlice, sliceIndex);
  };



  onAggregateSelect = (option) => {
    const { slice } = this.props;
    const { selectedDatasetColumn } = this.state;
    const columnType = _.get(selectedDatasetColumn, 'column_type');

    // spliting aggregation, operator values
    if (_.includes(AGGREGATION_TYPES, option.value)) {
      this.onSliceParamChange('aggregation', option.value);
      this.onSliceParamChange('operator', null);
    } else {
      this.onSliceParamChange('aggregation', null);
      this.onSliceParamChange('operator', option.value);

    }

  };

  onSliceParamChange = (field, value) => {
    let { slice, sliceIndex, onSliceValueChange } = this.props;
    slice[field] = value;
    onSliceValueChange(slice, sliceIndex);
  };

  onDatasetFieldSelect = (option, removeStatement) => {
    // group by option is consider as statement
    if (option.column_type === 'groupBy') {
      this.onSliceParamChange('statement', option.value);
    } else {
      if (removeStatement) {
        this.onSliceParamChange('statement', null);
      }
      // reseting slice values on column change
      this.onSliceColumnChnange({ column: option.value });
    }
  };


  getSelectedOption = (props) => {
    const { slice, datasetColumns } = props;
    const value = _.get(slice, 'column');
    return _.find(datasetColumns, { value }) || {};
  }

  translationScope = 'shared.components.create_alert_modal.custom_alert';

  renderFunctionalOperatorField() {
    const { slice } = this.props;

    let conditionDropDownOption = {
      options: [
        { title: '>', value: '>' },
        { title: '<', value: '<' },
        { title: '>=', value: '>=' },
        { title: '<=', value: '<=' },
        { title: '=', value: '=' }],
      placeholder: I18n.t('placeholder.operator', { scope: this.translationScope }),
      size: 'small',
      showOptionsBelowHandle: true
    };

    if (_.includes(AGGREGATION_TYPES, slice.aggregation)) {
      return (
        <div styleName="field-selector" className="function-operator-field">
          <Dropdown
            {...conditionDropDownOption}
            onSelection={(option) => this.onSliceParamChange('function_operator', option.value)}
            value={slice.function_operator} />
        </div>
      );
    }
  }

  renderOtherValueInput() {
    const { slice } = this.props;
          const { selectedDatasetColumn } = this.state;
          const columnType = _.get(selectedDatasetColumn, 'column_type');
    const showAggregationInput = _.includes(AGGREGATION_TYPES, slice.aggregation);
    const placeHolder = I18n.t('placeholder.value', { scope: this.translationScope });
    let showValueInput = (showAggregationInput && !_.isEmpty(slice.function_operator)) ||
      (!_.isEmpty(slice.operator) && !showAggregationInput);

    if (showValueInput && _.includes(['number', 'money', 'amount', 'row_identifier'], columnType)) {
      return (
        <div styleName="field-selector" className="value-field">
          <input
            styleName="value-input"
            type="text"
            placeholder={placeHolder}
            value={slice.value}
            onChange={(event) => this.onSliceParamChange('value', event.target.value)} />
        </div>
      );
    }
  }

  renderDateValueInput() {
    return (<div>TODO: Date Picker</div>)
  }

  renderAggregateTypeField() {
    const { slice } = this.props;
    const { selectedDatasetColumn } = this.state;

    let aggregateDropDownOption = {
      options: aggregateOptions(selectedDatasetColumn),
      placeholder: I18n.t('placeholder.aggregation', { scope: this.translationScope }),
      size: 'small',
      showOptionsBelowHandle: true
    };
    let aggregationValue = (slice.operator || slice.aggregation);

    if (_.isEmpty(slice.statement) && !_.isEmpty(slice.column)) {
      return (
        <div styleName="field-selector" className="aggregation-selector">
          <Dropdown
            {...aggregateDropDownOption}
            onSelection={this.onAggregateSelect}
            value={aggregationValue} />
        </div>
      );
    }
  }

  renderDatasetColumn() {
    const { slice, datasetColumns } = this.props;
    const dropDownAttributes = {
      showOptionsBelowHandle: true,
      size: 'small',
      placeholder: I18n.t('placeholder.column', { scope: this.translationScope })
    };

    return (
      <div styleName="field-selector" className="dataset-column-selector">
        <Dropdown
          {...dropDownAttributes}
          onSelection={(option) => this.onDatasetFieldSelect(option, false)}
          options={datasetColumns}
          value={slice.column} />
      </div>
    );
  }

  renderStatementOrCountOrColumnInput() {
    const { slice, datasetColumns } = this.props;
    const dropDownAttributes = {
      showOptionsBelowHandle: true,
      size: 'small',
      placeholder: I18n.t('placeholder.column', { scope: this.translationScope })
    };

    if (!_.isEmpty(slice.statement)) {
      return (
        <div styleName="field-selector">
          <Dropdown
            {...dropDownAttributes}
            onSelection={(option) => this.onDatasetFieldSelect(option, true)}
            options={datasetColumns}
            value={slice.statement} />
        </div>
      );
    }
  }

  renderLogicalOperator() {
    const { sliceIndex, slice } = this.props;
    const andText = I18n.t('aggregation.and', { scope: this.translationScope });
    const orText = I18n.t('aggregation.or', { scope: this.translationScope });

    if (sliceIndex > 0) {
      let buttonText = (slice.logical_operator === 'or') ? orText : andText;
      let buttonValue = (slice.logical_operator === 'or') ? 'and' : 'or';
      return (
        <div styleName="field-selector" className="logical-operator">
          <button
            styleName="operator-button"
            onClick={() => this.onSliceParamChange('logical_operator', buttonValue)}
            className="btn btn-default">
            {buttonText}
          </button>
        </div>
      );
    }
  }

  renderLocationValueInput() {
    return (<div> TODO: Location Fields/ Slider </div>)
  }

  renderTextValueInput() {
    const { haveNbeView, slice, viewId } = this.props;
    const { selectedDatasetColumn } = this.state;

    if (!_.isEmpty(slice.operator)) {
      return (
        <div styleName="field-selector" className="column-value-field">
          <input
            styleName="value-input"
            type="text"
            placeholder={placeHolder}
            value={slice.value}
            onChange={(event) => this.onSliceParamChange('value', event.target.value)}
        </div>
      );
    }
  }

  render() {
    const { sliceIndex, removeSliceEntry } = this.props;
    const { selectedDatasetColumn } = this.state;
    const columnType = _.get(selectedDatasetColumn, 'column_type');
    let valueInputField;

    if (_.includes(STRING_COLUMN_TYPES, columnType)) {
      valueInputField = this.renderTextValueInput();
    } else if (_.includes(DATE_COLUMN_TYPES, columnType)) {
      valueInputField = this.renderDateValueInput();
    } else if (_.includes(LOCATION_COLUMN_TYPES, columnType)) {
      valueInputField = this.renderLocationValueInput();
    } else {
      valueInputField = this.renderOtherValueInput();
    }

    return (
      <div styleName="soql-slice-builder">
        {/* Logical operator */}
        {this.renderLogicalOperator()}
        {/* Groupby/count(*)/Dataset Column */}
        {this.renderStatementOrCountOrColumnInput()}
        {/* Dataset Column */}
        {this.renderDatasetColumn()}
        {/* Column Aggregate */}
        {this.renderAggregateTypeField()}
        {/* Operator */}
        {this.renderFunctionalOperatorField()}
        {/* Value Form fields */}
        {valueInputField}
        {/* Remove slice button */}
        {(sliceIndex > 0) ? (
          <span
            styleName="delete-icon"
            onClick={() => removeSliceEntry(sliceIndex)}
            className="icon-close" />
        ) : null}

      </div>
    );
  }
}

SoqlSliceBuilder.propTypes = {
  datasetColumns: PropTypes.array,
  haveNbeView: PropTypes.bool,
  slice: PropTypes.object.isRequired,
  sliceIndex: PropTypes.number,
  onSliceValueChange: PropTypes.func,
  removeSliceEntry: PropTypes.func
};

export default cssModules(SoqlSliceBuilder, styles, { allowMultiple: true });
