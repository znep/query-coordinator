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
import DatasetColumnValueTypeahead from '../DatasetColumnValueTypeahead';
import InputDropDown from '../InputDropDown';
import GeocoderTypeahead from '../GeocoderTypeahead';
import RadiusSlider from '../RadiusSlider';
import styles from '../components.module.scss';

/**
 <description>
 @prop slice - object represnt slice values
 @prop sliceIndex - slice index number
 @prop datasetColumns - dataset column values
 @prop haveNbeView - boolean value to represnt dataset has NBE view
 @prop removeSliceEntry - trigger when slice delete button clciked
 @prop onSliceValueChange - trigger when slice values change
*/

/**
 Used in conjuction with SoqlBuilder. Shows form field(one row of SoqlBuilder) for creating
 one slice of a soql query. Different fields are as below
 - Logical operator: AND|OR
 - Statement: Group by
 - Count(*): count in each group or in the entire dataset.
 - Column: Columns in the dataset.
 - Aggregate: SUM|AVG|MIN|MAX|MEDIAN
 - Operator: +|-|>|<|<=|>=|NEAR(location)|WIHTIN(date)|NOT WITHIN(date)
 - Value: DateRangePicker|GeoCodeTypeahead|ColumnValueTypeahead|SimpleTextBox

 The second dropdown lists groupBy|count(*) and columns. Based on which option is selected,
 the remaining applicable form fields show up.

 On selecting GroupBy  : It shows only one more form field for selecting the column.
 On selecting Count(*) : It shows form fields: 'operator' and 'value'
 On selecting Column   :
 - It shows 'aggregate/operator' 'value'
 - It shows 'aggregate' 'operator' 'value'

 For Value selection:
 - DateRangePicker   : is shown when the selected column is of type date or simillar.
 - GeocoderTypeahead : is shown when the selected column is of type location or point.
 - DatasetColumnValueTypeahead   : is shown when the sected column is text or simillar.

 Sample Soql slices:
 [
   {column: 'rowcount', operator: '>', 'value': 10},
   {column: 'number', operator: '>', value: '10', logical_operator: 'and'},
   {column: 'number', aggregation: 'sum', operator: '>', start_date: '1/29/2017'},
   {column: 'text', '=', value: 'abc', logical_operator: 'no'},
   {column: 'loaction', 'with in', location: 'abc' lat: '10.344', lat: '23.2323', radius: 5},
   {column: 'group', operator: 'department'},
 ]

 -------------------------------------
 Sample rendering of the above slices:
 -------------------------------------
 | Logical Operator | StatementOrCountOrColumn | Column    | Aggregate | Operator/FunctionalOperator | Value | location | lat | lng | start_date | end_date|
 |                  |   rowcount               |           |           |          >                  | 10    |          |     |     |            |         |
 |   and            |    numberc               |           |   sum     |          >                  |  20   |          |     |     |            |         |
 |    or            |    text                  |           |           |          =                  | abc   |          |     |     |            |         |
 |   and            |    location              |           |           |         near                |       |    USA   |10.33|43.23|            |         |
 |   and            |    group                 | deartment |           |                             |       |
 |   and            |    date                  |           |           |        with in              |       |          |     |      |24/3/2016  |20/9/2017|
*/
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

  onDatePickerChange = (dateRange) => {
    this.onSliceParamChange('start_date', dateRange.start);
    this.onSliceParamChange('end_date', dateRange.end);
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
      if (_.includes(DATE_COLUMN_TYPES, columnType)) {
        // added default value for slice date
        let startDate = (slice.start_date || moment().format('YYYY-MM-DD'));
        let endDate = (slice.end_date || moment().format('YYYY-MM-DD'));
        this.onSliceParamChange('start_date', startDate);
        this.onSliceParamChange('end_date', endDate);
      }
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

  onLocationValueChange = (geocodeResult) => {
    let { slice } = this.props;
    let coordinates = _.get(geocodeResult, 'geometry.coordinates', []);

    // Todo: called multiple times. Need to fix this.
    // location columns lat, lng values
    this.onSliceParamChange('lng', coordinates[0]);
    this.onSliceParamChange('lat', coordinates[1]);
    this.onSliceParamChange('location', _.get(geocodeResult, 'value'));

    // adding default value for radius slider
    this.onSliceParamChange('radius', _.get(slice, 'radius', 1));
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
    const { slice } = this.props;
    const { selectedDatasetColumn } = this.state;
    const columnType = _.get(selectedDatasetColumn, 'column_type');
    let startDate = (slice.start_date || moment().format('YYYY-MM-DD'));
    let endDate = (slice.end_date || moment().format('YYYY-MM-DD'));
    let dateFieldSelected = _.includes(DATE_COLUMN_TYPES, columnType);
    let dateRangeOptions = {
      value: { start: startDate, end: endDate },
      onChange: this.onDatePickerChange,
      datePickerOverrides: {
        popperPlacement: 'left-start',
        popperModifiers: {
          preventOverflow: {
            enabled: true,
            escapeWithReference: false,
            boundariesElement: 'viewport'
          }
        }
      }
    };

    if (dateFieldSelected && !_.isEmpty(slice.operator)) {
      return (
        <div className="range-filter-container date-range" styleName="field-selector">
          <DateRangePicker {...dateRangeOptions} />
        </div>
      );
    }
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
    const { slice, mapboxAccessToken } = this.props;
    const { selectedDatasetColumn } = this.state;
    const columnType = _.get(selectedDatasetColumn, 'column_type');
    let radiusInputField;
    let geocoderInputField;

    if (!_.includes(LOCATION_COLUMN_TYPES, columnType)) {
      return;
    }

    if (!_.isEmpty(slice.operator)) {
      geocoderInputField = (
        <GeocoderTypeahead
          mapboxAccessToken={mapboxAccessToken}
          onSelect={this.onLocationValueChange}
          value={slice.location} />
      );
    }
    if (!_.isEmpty(slice.location)) {
      radiusInputField = (
        <RadiusSlider
          value={Number(slice.radius || 5)}
          onValueChange={(value) => this.onSliceParamChange('radius', value)} />
      );
    }

    return (
      <div styleName="field-selector">
        {geocoderInputField}
        {radiusInputField}
      </div>
    );
  }

  renderTextValueInput() {
    const { haveNbeView, slice, viewId } = this.props;
    const { selectedDatasetColumn } = this.state;

    if (!_.isEmpty(slice.operator)) {
      return (
        <div styleName="field-selector" className="column-value-field">
          <DatasetColumnValueTypeahead
            column={selectedDatasetColumn.value}
            haveNbeView={haveNbeView}
            value={slice.value || ''}
            viewId={viewId}
            onSelect={(option) => { this.onSliceParamChange('value', option.value); }} />
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
