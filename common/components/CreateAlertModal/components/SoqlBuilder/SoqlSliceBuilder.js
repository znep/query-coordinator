import _ from 'lodash';
import cssModules from 'react-css-modules';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';
import DateRangePicker from 'common/components/DateRangePicker';
import Dropdown from 'common/components/Dropdown';

import {
  AGGREGATION_TYPES,
  DATE_COLUMN_TYPES,
  LOCATION_COLUMN_TYPES,
  NUMBER_COLUMN_TYPES,
  STRING_COLUMN_TYPES
} from 'common/components/CreateAlertModal/constants';
import { aggregateOptions } from './helpers';
import DatasetColumnValueTypeahead from '../DatasetColumnValueTypeahead';
import InputDropDown from '../InputDropDown';
import GeocoderTypeahead from '../GeocoderTypeahead';
import RadiusSlider from '../RadiusSlider';
import styles from '../components.module.scss';
import SoqlSliceBuilderPropType from './SoqlSliceBuilderPropType';


/**
 @prop slice - object represent slice values
 @prop sliceIndex - slice index number
 @prop datasetColumns - dataset column values
 @prop haveNbeView - boolean value to represent dataset has NBE view
 @prop removeSliceEntry - trigger when slice delete button clicked
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
 - Operator: +|-|>|<|<=|>=|NEAR(location)|WITHIN(date)|NOT WITHIN(date)
 - Value: DateRangePicker|GeoCodeTypeahead|ColumnValueTypeahead|SimpleTextBox

 The second dropdown lists groupBy|count(*) and columns. Based on which option is selected,
 the remaining applicable form fields show up.

 On selecting GroupBy  : It shows only one more form field for selecting the column.
 On selecting Count(*) : It shows form fields: 'operator' and 'value'
 On selecting Column   :
    For number column: It shows 'aggregate and operator'
      - On selecting aggregate, it shows 'operator', 'value'
      - On selecting operator it shows 'value'
    For other columns: It shows 'operator', 'value'

 For Value selection:
 - DateRangePicker   : is shown when the selected column is of type date or similar.
 - GeocoderTypeahead : is shown when the selected column is of type location or point.
 - DatasetColumnValueTypeahead   : is shown when the sected column is text or simillar.

 Sample Soql slices:
 [
   {column: 'rowcount', operator: '>', 'value': 10},
   {column: 'number', operator: '>', value: '10', logical_operator: 'and'},
   {column: 'date', operator: 'within', start_date: '1/29/2017', end_date: '3/29/2017},
   {column: 'text', '=', value: 'abc', logical_operator: 'no'},
   {column: 'loaction', 'with in', location: 'abc' lat: '10.344', lng: '23.2323', radius: 5},
   {column: 'group', operator: 'department'},
 ]

 -------------------------------------
 Sample rendering of the above slices:
 -------------------------------------
 | Logical Operator | StatementOrCountOrColumn | Column    | Aggregate | Operator/FunctionalOperator | Value | location | lat | lng | start_date | end_date|
 |                  |   rowcount               |           |           |          >                  | 10    |          |     |     |            |         |
 |   and            |    number                |           |   sum     |          >                  |  20   |          |     |     |            |         |
 |    or            |    text                  |           |           |          =                  | abc   |          |     |     |            |         |
 |   and            |    location              |           |           |         near                |       |    USA   |10.33|43.23|            |         |
 |   and            |    group                 |department |           |                             |       |
 |   and            |    date                  |           |           |        with in              |       |          |     |      |24/3/2016  |20/9/2017|
*/
class SoqlSliceBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedColumnValues: [],
      selectedDatasetColumn: this.getSelectedOption(props)
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      selectedDatasetColumn: this.getSelectedOption(nextProps)
    });
  }

  onSliceColumnChange = (newSlice) => {
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
    const today = moment().format('YYYY-MM-DD');

    // spliting aggregation, operator values
    if (_.includes(AGGREGATION_TYPES, option.value)) {
      this.onSliceParamChange('aggregation', option.value);
      this.onSliceParamChange('operator', null);
    } else {
      this.onSliceParamChange('aggregation', null);
      this.onSliceParamChange('operator', option.value);
      if (_.includes(DATE_COLUMN_TYPES, columnType)) {
        // added default value for slice date
        this.onSliceParamChange('start_date', _.get(slice, 'start_date', today));
        this.onSliceParamChange('end_date', _.get(slice, 'end_date', today));
      }
    }

  };

  onSliceParamChange = (field, value) => {
    const { slice, sliceIndex, onSliceValueChange } = this.props;

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
      this.onSliceColumnChange({ column: option.value });
    }
  };

  onLocationValueChange = (geocodeResult) => {
    const { slice } = this.props;
    const coordinates = _.get(geocodeResult, 'geometry.coordinates', []);

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
    const conditionDropDownOption = {
      options: [
        { title: '>', value: '>' },
        { title: '<', value: '<' },
        { title: '>=', value: '>=' },
        { title: '<=', value: '<=' },
        { title: '=', value: '=' }],
      placeholder: I18n.t('placeholder.operator', { scope: this.translationScope }),
      showOptionsBelowHandle: true,
      size: 'small'
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
    const { aggregation, function_operator, operator, value } = this.props.slice;
    const { slice } = this.props;
    const { selectedDatasetColumn } = this.state;
    const columnType = _.get(selectedDatasetColumn, 'column_type');
    const otherInputTypes = _.concat(NUMBER_COLUMN_TYPES, ['row_identifier']);
    const showAggregationInput = _.includes(AGGREGATION_TYPES, aggregation);
    const placeHolder = I18n.t('placeholder.value', { scope: this.translationScope });
    const showValueInput = (showAggregationInput && !_.isEmpty(function_operator)) ||
      (!_.isEmpty(operator) && !showAggregationInput);

    if (showValueInput && _.includes(otherInputTypes, columnType)) {
      return (
        <div styleName="field-selector" className="value-field">
          <input
            styleName="value-input"
            type="text"
            placeholder={placeHolder}
            value={value}
            onChange={(event) => this.onSliceParamChange('value', event.target.value)} />
        </div>
      );
    }
  }

  renderDateValueInput() {
    const { slice } = this.props;
    const { selectedDatasetColumn } = this.state;
    const today = moment().format('YYYY-MM-DD');
    const columnType = _.get(selectedDatasetColumn, 'column_type');
    const startDate = _.get(slice, 'start_date', today);
    const endDate = _.get(slice, 'end_date', today);
    const dateFieldSelected = _.includes(DATE_COLUMN_TYPES, columnType);
    const dateRangeOptions = {
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
    const { aggregation, column, operator, statement } = this.props.slice;
    const { selectedDatasetColumn } = this.state;
    const aggregateDropDownOption = {
      options: aggregateOptions(selectedDatasetColumn),
      placeholder: I18n.t('placeholder.aggregation', { scope: this.translationScope }),
      showOptionsBelowHandle: true,
      size: 'small'
    };
    const aggregationValue = (operator || aggregation);

    if (_.isEmpty(statement) && !_.isEmpty(column)) {
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
    const { datasetColumns, slice } = this.props;
    const dropDownAttributes = {
      placeholder: I18n.t('placeholder.column', { scope: this.translationScope }),
      showOptionsBelowHandle: true,
      size: 'small'
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
      placeholder: I18n.t('placeholder.column', { scope: this.translationScope }),
      showOptionsBelowHandle: true,
      size: 'small'
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
      const buttonText = (slice.logical_operator === 'or') ? orText : andText;
      const buttonValue = (slice.logical_operator === 'or') ? 'and' : 'or';
      return (
        <div styleName="field-selector" className="logical-operator">
          <button
            styleName="operator-button btn-default"
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
          // sometimes (eg: editmode ) radius value may be string & slider accepts only number
          value={Number(slice.radius)}
          onChange={(value) => this.onSliceParamChange('radius', value)} />
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
            value={slice.value}
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
  slice: SoqlSliceBuilderPropType.isRequired,
  sliceIndex: PropTypes.number,
  onSliceValueChange: PropTypes.func,
  removeSliceEntry: PropTypes.func
};

export default cssModules(SoqlSliceBuilder, styles, { allowMultiple: true });
