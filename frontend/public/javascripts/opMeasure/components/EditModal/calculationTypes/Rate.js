import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators, compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';
import { Checkbox, Dropdown, SocrataIcon, AccordionContainer, AccordionPane } from 'common/components';
import {
  setAggregationType,
  setDenominatorColumn,
  setNumeratorColumn,
  toggleNumeratorExcludeNullValues,
  toggleDenominatorExcludeNullValues,
  setFixedDenominator
} from '../../../actions/editor';

import withComputedMeasure from '../../withComputedMeasure';
import { CalculationTypeNames } from '../../../lib/constants';

export class Rate extends Component {

  renderConfigPane() {
    const {
      aggregationType,
      displayableFilterableColumns,
      onToggleNumeratorExcludeNullValues,
      onToggleDenominatorExcludeNullValues,
      onSelectAggregationType,
      numeratorExcludeNullValues,
      denominatorExcludeNullValues,
      fixedDenominator,
      onChangeFixedDenominator
    } = this.props;

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
      placeholder: I18n.t('open_performance.measure.edit_modal.calculation.choose_column'),
      onSelection: (option) => {
        this.props.onSelectNumeratorColumn(option.value);
      },
      options: _.filter(displayableFilterableColumns, { renderTypeName: 'number' }).map(numberCol => ({
        title: numberCol.name,
        value: numberCol.fieldName,
        icon: <SocrataIcon name="number" />
      })),
      value: this.props.numeratorColumnFieldName,
      id: 'numerator-column'
    };

    const denominatorColumnDropdownOptions = {
      placeholder: I18n.t('open_performance.measure.edit_modal.calculation.choose_column'),
      onSelection: (option) => {
        this.props.onSelectDenominatorColumn(option.value);
      },
      options: _.filter(displayableFilterableColumns, { renderTypeName: 'number' }).map(numberCol => ({
        title: numberCol.name,
        value: numberCol.fieldName,
        icon: <SocrataIcon name="number" />
      })),
      value: this.props.denominatorColumnFieldName,
      id: 'denominator-column'
    };

    const fixedDenominatorId = 'fixed-denominator-input';
    const fixedDenominatorAttributes = {
      id: fixedDenominatorId,
      className: 'text-input',
      type: 'number',
      onChange: (event) => onChangeFixedDenominator(event.target.value),
      value: fixedDenominator
    };

    const showExcludeNullValues = aggregationType === 'count';

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
            <Dropdown {...numeratorColumnDropdownOptions} />
            {
              showExcludeNullValues ? <Checkbox
                id="exclude-null-values-numerator"
                onChange={onToggleNumeratorExcludeNullValues}
                checked={numeratorExcludeNullValues}>
                {I18n.t('open_performance.measure.edit_modal.calculation.exclude_nulls')}
              </Checkbox> : null
            }
          </AccordionPane>
          <AccordionPane
            title={I18n.t('open_performance.measure.edit_modal.calculation.types.rate.denominator_title')}>
            <div className="option-subtitle">
              {I18n.t('open_performance.measure.edit_modal.calculation.types.rate.denominator_subtitle')}
            </div>
            <Dropdown {...denominatorColumnDropdownOptions} />
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
  onSelectAggregationType: PropTypes.func.isRequired,
  onSelectDenominatorColumn: PropTypes.func.isRequired,
  onSelectNumeratorColumn: PropTypes.func.isRequired,
  onToggleNumeratorExcludeNullValues: PropTypes.func.isRequired,
  onToggleDenominatorExcludeNullValues: PropTypes.func.isRequired,
  onChangeFixedDenominator: PropTypes.func.isRequired,
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

  return {
    aggregationType,
    denominatorColumnFieldName,
    denominatorExcludeNullValues,
    displayableFilterableColumns,
    fixedDenominator,
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
    onToggleNumeratorExcludeNullValues: toggleNumeratorExcludeNullValues,
    onToggleDenominatorExcludeNullValues: toggleDenominatorExcludeNullValues,
    onChangeFixedDenominator: setFixedDenominator
  }, dispatch);
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withComputedMeasure()
)(Rate);
