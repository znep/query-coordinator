import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classnames from 'classnames';

import I18n from 'common/i18n';
import { formatNumber } from 'common/js_utils';
import { SocrataIcon } from 'common/components';

import withComputedMeasure from './withComputedMeasure';
import { PeriodTypes } from '../lib/constants';

// Calculates and displays a measure as a tile
export class MeasureResultCard extends Component {

  getSubtitle() {
    const { measure, computedMeasure } = this.props;

    const {
      calculationNotConfigured,
      dataSourceNotConfigured,
      dividingByZero,
      noReportingPeriodAvailable,
      noReportingPeriodConfigured
    } = computedMeasure;

    // TODO: Consider removing the else's because we are returning on matches.
    if (dataSourceNotConfigured || _.isEmpty(computedMeasure)) {
      return I18n.t('shared.performance_measures.no_dataset');
    } else if (calculationNotConfigured) {
      return I18n.t('shared.performance_measures.no_calculation');
    } else if (noReportingPeriodConfigured) {
      return I18n.t('shared.performance_measures.no_reporting_period');
    } else if (noReportingPeriodAvailable) {
      return I18n.t('shared.performance_measures.not_enough_data');
    } else if (dividingByZero) {
      return I18n.t('shared.performance_measures.measure.dividing_by_zero');
    } else {
      return _.get(measure, 'metricConfig.display.label', '');
    }
  }

  renderResult(result) {
    if (!isFinite(result)) {
      // TODO: Decide if we want to use 'warning' for the icon, instead of the default 'number'
      return this.renderPlaceholder();
    }

    const { maxLength, measure } = this.props;
    const asPercent = _.get(measure, 'metricConfig.display.asPercent', false);
    // Default value of -1 for decimalPlaces indicates that no precision was set.
    const decimalPlaces = _.get(measure, 'metricConfig.display.decimalPlaces', -1);

    const resultClassNames = classnames(
      'measure-result-big-number',
      { percent: asPercent }
    );
    let formatted = result;
    const parts = result.split('.');

    if (parts[0].length > 6) {
      // This is a large number, where decimal places are kind of irrelavant.
      // formatNumber provides the human readable value like 257K and 48M.
      formatted = formatNumber(Number(result));
    } else if (parts.length > 1) {
      if (decimalPlaces === 0) {
        formatted = parts[0];
      } else if (decimalPlaces !== -1 && parts[1].length > decimalPlaces) {
        formatted = `${parts[0]}${I18n.defaultSeparator}${parts[1].substring(0, decimalPlaces)}`;
      }
    }
    // We might still not have room for however many decimalPlaces are requested.
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength);
    }

    return (
      <div className="measure-result-value">
        <div className={resultClassNames} title={formatted}>{formatted}</div>
        <div className="measure-result-subtitle">
          {this.getSubtitle()}
        </div>
        {this.renderPeriod()}
      </div>
    );
  }

  renderPlaceholder(icon = 'number') {
    return (
      <div className="measure-result-placeholder">
        <SocrataIcon name={icon} />
        <div className="measure-result-placeholder-text">
          {this.getSubtitle()}
        </div>
      </div>
    );
  }

  renderPeriod() {
    const { measure } = this.props;
    const reportingPeriod = _.get(measure, 'metricConfig.reportingPeriod', {});
    const isClosed = reportingPeriod.type === PeriodTypes.CLOSED;

    return (
      <div className="reporting-period-type">
        {
          isClosed ?
            I18n.t('shared.performance_measures.measure.as_of_last') :
            I18n.t('shared.performance_measures.measure.as_of_today')
        }
      </div>
    );
  }

  render() {
    const { computedMeasure, dataRequestInFlight } = this.props;
    const { result } = computedMeasure;

    const spinner = (
      <div className="measure-result-spinner-container">
        <div className="spinner-default spinner-large"></div>
      </div>
    );

    const content = result ?
      this.renderResult(result) :
      this.renderPlaceholder();

    return (
      <div className="measure-result-card">
        {dataRequestInFlight ? spinner : content}
      </div>
    );
  }
}

MeasureResultCard.defaultProps = {
  computedMeasure: {},
  // maxLength was chosen based on looking at roughly how many digits fit into the div.
  // This is an approximate value that could be refined later.
  maxLength: 6
};

MeasureResultCard.propTypes = {
  measure: PropTypes.shape({
    // Add more as additional parts of the measure are used.
    metric: PropTypes.shape({
      display: PropTypes.shape({
        label: PropTypes.string,
        decimalPlaces: PropTypes.number,
        asPercent: PropTypes.bool
      })
    })
  }).isRequired,
  // TODO: Consider adding a shape for computedMeasure
  computedMeasure: PropTypes.object, // See withComputedMeasure.
  dataRequestInFlight: PropTypes.bool,
  maxLength: PropTypes.number // Can override the measure decimalPlaces.
};

export default withComputedMeasure()(MeasureResultCard);
