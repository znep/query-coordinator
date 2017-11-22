import $ from 'jquery';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators, compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';
import {
  AccordionContainer,
  AccordionPane,
  Checkbox,
  Dropdown,
  Flannel,
  FlannelContent,
  SocrataIcon
} from 'common/components';
import FilterEditor from 'common/components/FilterBar/FilterEditor';
import { getFilterToggleText } from 'common/components/FilterBar/filters';
import { getIconForDataType } from 'common/icons';

import ColumnDropdown from '../ColumnDropdown';

import {
  setAggregationType,
  setDenominatorColumn,
  setFixedDenominator,
  setNumeratorColumn,
  setNumeratorColumnCondition,
  toggleDenominatorExcludeNullValues,
  toggleNumeratorExcludeNullValues
} from '../../../actions/editor';

import withComputedMeasure from '../../withComputedMeasure';
import { CalculationTypeNames } from '../../../lib/constants';

export class Rate extends Component {
  constructor() {
    super();

    this.state = {};
  }

  onClickSetColumnConditions = () => {
    this.setState({ columnConditionsFlyoutOpen: true });
  }

  onFilterChanged = (condition) => {
    this.setState({ columnConditionsFlyoutOpen: false });
    this.props.onSelectNumeratorColumnCondition(condition);
  }

  onFilterFlannelDismiss = (event) => {
    /*
      The third-party library used for DateRangePicker adds the calendar element on the page body but not
      within the Flannel div element. As a result, clicking on the calendar is considered to be outside of
      the Flannel div element and causes the flannel to think it should be dismissed. We know better.
    */
    const isInsideDatePicker = event && $(event.target).closest('.react-datepicker').length > 0;
    // Close if outside datepicker.
    this.setState({ columnConditionsFlyoutOpen: isInsideDatePicker });
  }

  renderNumeratorColumnConditionsFlyout() {
    const { numeratorColumn, numeratorColumnCondition } = this.props;
    const { columnConditionsFlyoutOpen } = this.state;

    if (!columnConditionsFlyoutOpen || !numeratorColumn) {
      return null;
    }

    // eslint-disable-next-line max-len
    const headerText = I18n.t(`open_performance.measure.edit_modal.calculation.types.rate.conditions.header.${numeratorColumn.dataTypeName}`);

    const header = (
      <div className="rate-metric-numerator-column-condition-header">
        <h6>
          <SocrataIcon name={getIconForDataType(numeratorColumn.dataTypeName)} />
          {headerText}
        </h6>
        {I18n.t('open_performance.measure.edit_modal.calculation.types.rate.conditions.subheader')}
      </div>
    );

    const filterProps = {
      filter: numeratorColumnCondition || {},
      column: numeratorColumn,
      onRemove: () => this.onFilterChanged(null),
      onUpdate: this.onFilterChanged,
      header,
      hideNullValueCheckbox: true
    };

    const flannelProps = {
      id: 'rate-metric-numerator-column-conditions',
      // The calendar_date filter editor's date pickers open on focus. If we autofocus
      // those, the date picker will open as soon as the user starts editing the filter. This
      // is very confusing. However, for all other types, focusing the first textbox/slider/etc
      // is helpful.
      autoFocus: numeratorColumn.dataTypeName !== 'calendar_date',
      title: I18n.t('open_performance.measure.edit_modal.calculation.types.rate.set_column_conditions'),
      isOpen: true,
      onDismiss: this.onFilterFlannelDismiss,
      target: () => this.numeratorColumnConditionLinkRef
    };

    return (
      <Flannel {...flannelProps}>
        <FlannelContent>
          <FilterEditor {...filterProps} />
        </FlannelContent>
      </Flannel>
    );
  }

  renderNumeratorColumnConditions() {
    const { numeratorColumn, numeratorColumnCondition } = this.props;

    if (!numeratorColumn) {
      return null;
    }

    let text = I18n.t('open_performance.measure.edit_modal.calculation.types.rate.set_column_conditions');
    if (numeratorColumnCondition) {
      const condition = getFilterToggleText(numeratorColumnCondition, numeratorColumn);
      // eslint-disable-next-line max-len
      text = `${I18n.t('open_performance.measure.edit_modal.calculation.types.rate.condition_text_prefix')} ${condition}`;
    }

    return (
      <a
        role="button"
        href="#"
        ref={(ref) => this.numeratorColumnConditionLinkRef = ref}
        onClick={this.onClickSetColumnConditions}>
        {text}
      </a>
    );
  }

  renderConfigPane() {
    const {
      aggregationType,
      denominatorExcludeNullValues,
      displayableFilterableColumns,
      fixedDenominator,
      measure,
      numeratorExcludeNullValues,
      onChangeFixedDenominator,
      onSelectAggregationType,
      onToggleDenominatorExcludeNullValues,
      onToggleNumeratorExcludeNullValues
    } = this.props;

    const showExcludeNullValues = aggregationType === 'count';

    const aggregationDropdownOptions = {
      placeholder: I18n.t('open_performance.measure.edit_modal.calculation.choose_aggregation'),
      onSelection: (option) => {
        onSelectAggregationType(option.value);
      },
      options: [{
        title: I18n.t('open_performance.calculation_types.count'),
        value: CalculationTypeNames.COUNT
      }, {
        title: I18n.t('open_performance.calculation_types.sum'),
        value: CalculationTypeNames.SUM
      }],
      value: aggregationType,
      id: 'aggregation'
    };

    const numeratorColumnDropdownOptions = {
      columnFieldName: this.props.numeratorColumnFieldName,
      displayableFilterableColumns,
      id: 'numerator-column',
      measure,
      measureArgument: 'numerator',
      onSelectColumn: this.props.onSelectNumeratorColumn
    };

    const denominatorColumnDropdownOptions = {
      columnFieldName: this.props.denominatorColumnFieldName,
      displayableFilterableColumns,
      id: 'denominator-column',
      measure,
      measureArgument: 'denominator',
      onSelectColumn: this.props.onSelectDenominatorColumn
    };

    const fixedDenominatorId = 'fixed-denominator-input';
    const fixedDenominatorAttributes = {
      id: fixedDenominatorId,
      className: 'text-input',
      type: 'number',
      onChange: (event) => onChangeFixedDenominator(event.target.value),
      value: fixedDenominator
    };

    return (
      <div className="metric-config">
        <div className="option-title">
          {I18n.t('open_performance.measure.edit_modal.calculation.types.rate.aggregation_title')}
        </div>
        <div className="option-subtitle">
          {I18n.t('open_performance.measure.edit_modal.calculation.types.rate.aggregation_subtitle')}
        </div>
        <Dropdown {...aggregationDropdownOptions} />
        <AccordionContainer>
          <AccordionPane
            title={I18n.t('open_performance.measure.edit_modal.calculation.types.rate.numerator_title')}>
            <div className="option-subtitle">
              {I18n.t('open_performance.measure.edit_modal.calculation.types.rate.numerator_subtitle')}
            </div>
            <ColumnDropdown {...numeratorColumnDropdownOptions} />
            {
              showExcludeNullValues ? <Checkbox
                id="exclude-null-values-numerator"
                onChange={onToggleNumeratorExcludeNullValues}
                checked={numeratorExcludeNullValues}>
                {I18n.t('open_performance.measure.edit_modal.calculation.exclude_nulls')}
              </Checkbox> : null
            }
            {this.renderNumeratorColumnConditions()}
          </AccordionPane>
          <AccordionPane
            title={I18n.t('open_performance.measure.edit_modal.calculation.types.rate.denominator_title')}>
            <div className="option-subtitle">
              {I18n.t('open_performance.measure.edit_modal.calculation.types.rate.denominator_subtitle')}
            </div>
            <ColumnDropdown {...denominatorColumnDropdownOptions} />
            {
              showExcludeNullValues ? <Checkbox
                id="exclude-null-values-denominator"
                onChange={onToggleDenominatorExcludeNullValues}
                checked={denominatorExcludeNullValues}>
                {I18n.t('open_performance.measure.edit_modal.calculation.exclude_nulls')}
              </Checkbox> : null
            }
            <label htmlFor={fixedDenominatorId} className="rate-metric-denominator-direct-input">
              <h5>
                {I18n.t('open_performance.measure.edit_modal.calculation.types.rate.direct_input_title')}
              </h5>
              <div className="option-subtitle">
                {I18n.t('open_performance.measure.edit_modal.calculation.types.rate.direct_input_subtitle')}
              </div>
            </label>
            <input {...fixedDenominatorAttributes} />
          </AccordionPane>
        </AccordionContainer>
        {this.renderNumeratorColumnConditionsFlyout()}
      </div>
    );
  }

  renderDefinition() {
    const numerator = _.get(this.props, 'computedMeasure.numerator');
    const denominator = _.get(this.props, 'computedMeasure.denominator');
    const dividingByZero = _.get(this.props, 'computedMeasure.dividingByZero');

    const callToActionClass = classNames(
      'rate-metric-call-to-action',
      { visible: !numerator && !denominator }
    );

    const callToActionText = this.props.aggregationType ?
      I18n.t('open_performance.measure.edit_modal.calculation.types.rate.fraction_no_values') :
      I18n.t('open_performance.measure.edit_modal.calculation.types.rate.fraction_not_available');

    const denominatorClassName = classNames(
      'rate-metric-denominator',
      {
        'rate-metric-dividing-by-zero': dividingByZero
      }
    );
    const denominatorTitle = dividingByZero ? I18n.t('open_performance.measure.dividing_by_zero') : null;

    return (
      <div className="metric-definition-text">
        <div className="rate-metric-fraction">
          <h5>{I18n.t('open_performance.measure.edit_modal.calculation.types.rate.sample_fraction')}</h5>
          <div className="rate-metric-numerator">
            {numerator}
          </div>
          <div className={denominatorClassName} title={denominatorTitle}>
            {denominator}
          </div>
          <div className={callToActionClass}>
            {callToActionText}
          </div>
        </div>
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.types.rate.help_title')}
        </h5>
        {I18n.t('open_performance.measure.edit_modal.calculation.types.rate.help_body')}
      </div>
    );
  }

  render() {
    return (
      <div className="metric-container">
        {this.renderConfigPane()}
        {this.renderDefinition()}
      </div>
    );
  }
}

Rate.propTypes = {
  aggregationType: PropTypes.string,
  denominatorColumnFieldName: PropTypes.string,
  denominatorExcludeNullValues: PropTypes.bool.isRequired,
  displayableFilterableColumns: PropTypes.arrayOf(PropTypes.shape({
    renderTypeName: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fieldName: PropTypes.string.isRequired
  })),
  fixedDenominator: PropTypes.string,
  measure: PropTypes.object.isRequired,
  onSelectAggregationType: PropTypes.func.isRequired,
  onSelectDenominatorColumn: PropTypes.func.isRequired,
  onSelectNumeratorColumn: PropTypes.func.isRequired,
  onSelectNumeratorColumnCondition: PropTypes.func.isRequired,
  onToggleNumeratorExcludeNullValues: PropTypes.func.isRequired,
  onToggleDenominatorExcludeNullValues: PropTypes.func.isRequired,
  onChangeFixedDenominator: PropTypes.func.isRequired,
  numeratorColumn: PropTypes.object,
  numeratorColumnCondition: PropTypes.object,
  numeratorColumnFieldName: PropTypes.string,
  numeratorExcludeNullValues: PropTypes.bool.isRequired
};

function mapStateToProps(state) {
  const measure = _.get(state, 'editor.measure');
  const aggregationType = _.get(state, 'editor.measure.metric.arguments.aggregationType');
  const denominatorColumnFieldName = _.get(state, 'editor.measure.metric.arguments.denominatorColumn');
  const denominatorExcludeNullValues = _.get(
    state, 'editor.measure.metric.arguments.denominatorExcludeNullValues', false
  );
  const displayableFilterableColumns = _.get(state, 'editor.displayableFilterableColumns');
  const fixedDenominator = _.get(state, 'editor.measure.metric.arguments.fixedDenominator', '');
  const numeratorColumnFieldName = _.get(state, 'editor.measure.metric.arguments.numeratorColumn');
  const numeratorExcludeNullValues = _.get(
    state, 'editor.measure.metric.arguments.numeratorExcludeNullValues', false
  );
  const numeratorColumn = _.find(displayableFilterableColumns, { fieldName: numeratorColumnFieldName });
  const numeratorColumnCondition = _.get(state, 'editor.measure.metric.arguments.numeratorColumnCondition');

  if (numeratorColumnFieldName && !numeratorColumn) {
    throw new Error(`Numerator column not in filterable column set: ${numeratorColumnFieldName}`);
  }

  return {
    aggregationType,
    denominatorColumnFieldName,
    denominatorExcludeNullValues,
    displayableFilterableColumns,
    fixedDenominator,
    numeratorColumn,
    numeratorColumnCondition,
    numeratorColumnFieldName,
    numeratorExcludeNullValues,
    measure
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onSelectAggregationType: setAggregationType,
    onSelectDenominatorColumn: setDenominatorColumn,
    onSelectNumeratorColumn: setNumeratorColumn,
    onSelectNumeratorColumnCondition: setNumeratorColumnCondition,
    onToggleNumeratorExcludeNullValues: toggleNumeratorExcludeNullValues,
    onToggleDenominatorExcludeNullValues: toggleDenominatorExcludeNullValues,
    onChangeFixedDenominator: setFixedDenominator
  }, dispatch);
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withComputedMeasure()
)(Rate);
