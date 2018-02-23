import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

import I18n from 'common/i18n';
import { formatNumber } from 'common/js_utils';
import SocrataIcon from 'common/components/SocrataIcon';

import { MeasureTitle } from './MeasureTitle';
import withComputedMeasure from './withComputedMeasure';
import { PeriodTypes } from '../lib/constants';
import ReportingPeriods from '../lib/reportingPeriods';
import computedMeasurePropType from '../propTypes/computedMeasurePropType';

// Calculates and displays a measure as a tile
export class MeasureResultCard extends Component {

  getSubtitle() {
    const { measure, computedMeasure } = this.props;

    const {
      calculationNotConfigured,
      dataSourceNotConfigured,
      dividingByZero,
      noRecentValue,
      noReportingPeriodAvailable,
      noReportingPeriodConfigured,
      notEnoughData
    } = computedMeasure.errors;

    const dataSourceLensUid = _.get(measure, 'dataSourceLensUid');

    // NOTE: The order of these error states is important
    if (dataSourceNotConfigured || !dataSourceLensUid) {
      return I18n.t('shared.performance_measures.no_dataset');
    } else if (noReportingPeriodConfigured) {
      return I18n.t('shared.performance_measures.no_reporting_period');
    } else if (calculationNotConfigured) {
      return I18n.t('shared.performance_measures.no_calculation');
    } else if (noReportingPeriodAvailable || notEnoughData) {
      return I18n.t('shared.performance_measures.not_enough_data');
    } else if (noRecentValue) {
      return I18n.t('shared.performance_measures.no_recent_value');
    } else if (dividingByZero) {
      return I18n.t('shared.performance_measures.measure.dividing_by_zero');
    } else {
      return _.get(measure, 'metricConfig.display.label', '');
    }
  }

  renderTitle() {
    const { showMetadata, lens, measure } = this.props;

    if (!showMetadata) {
      return null;
    }

    return <MeasureTitle lens={lens} measure={measure} />;
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

    const resultClassNames = classNames(
      'measure-result-big-number',
      { percent: asPercent }
    );
    let formatted = result;
    const parts = result.split('.'); // BigNumber default separator is '.'

    const separator = I18n.defaultSeparator;

    if (parts[0].length > 6) {
      // This is a large number, where decimal places are kind of irrelavant.
      // formatNumber provides the human readable value like 257K and 48M.
      formatted = formatNumber(Number(result));
    } else if (parts.length > 1) {
      if (decimalPlaces === 0) {
        formatted = parts[0];
      } else if (decimalPlaces !== -1 && parts[1].length > decimalPlaces) {
        formatted = `${parts[0]}${separator}${parts[1].substring(0, decimalPlaces)}`;
      }
    }
    // We might still not have room for however many decimalPlaces are requested.
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength);
      // There might be a trailing separator that should be removed.
      if (formatted.endsWith(separator)) {
        formatted = formatted.substring(0, formatted.length - 1);
      }
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

  renderError() {
    const { dataSourceNotConfigured } = this.props.computedMeasure.errors;

    if (dataSourceNotConfigured) {
      return this.renderPlaceholder();
    }

    return (
      <div className="measure-result-value">
        <div className="measure-result-error measure-result-subtitle">
          {this.getSubtitle()}
        </div>
      </div>
    );
  }

  renderPlaceholder(icon = 'number') {
    return (
      <div className="measure-result-value placeholder">
        <SocrataIcon name={icon} />
        <div className="measure-result-placeholder-text measure-result-subtitle">
          {this.getSubtitle()}
        </div>
      </div>
    );
  }

  renderPeriod() {
    const { measure } = this.props;
    const reportingPeriod = _.get(measure, 'metricConfig.reportingPeriod', {});
    const isClosed = reportingPeriod.type === PeriodTypes.CLOSED;

    let reportingPeriodDates;
    let latestReporintPeriodMessage;

    if (ReportingPeriods.isConfigValid(reportingPeriod)) {
      reportingPeriodDates = new ReportingPeriods(reportingPeriod).seriesToDate();
      const latestReportingPeriodStart = _.last(reportingPeriodDates).start.format('M/D/YY');
      const latestReportingPeriodEnd = _.last(reportingPeriodDates).end.format('M/D/YY');

      latestReporintPeriodMessage = isClosed ?
        `${latestReportingPeriodStart} - ${latestReportingPeriodEnd}` :
        `${I18n.t('shared.performance_measures.measure.since')} ${latestReportingPeriodStart}`;
    }

    return (
      <div className="reporting-period-type">
        {
          isClosed ?
            I18n.t('shared.performance_measures.measure.as_of_last') :
            I18n.t('shared.performance_measures.measure.as_of_today')
        }
        <div className="reporting-period-latest">
          {`${latestReporintPeriodMessage}`}
        </div>
      </div>
    );
  }

  render() {
    const { measure, computedMeasure, dataRequestInFlight, showMetadata } = this.props;
    const { result } = computedMeasure;

    const spinner = (
      <div className="measure-result-spinner-container">
        {/*
            This used to be a real spinner, but we ran into baffling IE behavior at the last minute
            (EN-22336). Due to time pressure, we replaced the spinner with static text. EN-22374 tracks
            the real fix.
         */}
        <div>{I18n.t('shared.performance_measures.calculating')}</div>
      </div>
    );

    const busy = dataRequestInFlight || !measure;

    const rootClasses = classNames(
      'measure-result-card',
      {
        'with-metadata': showMetadata
      }
    );

    const title = busy ? null : this.renderTitle();

    let content = result && result.value ?
      this.renderResult(result.value) :
      this.renderError();
    content = busy ? spinner : content;


    return (
      <div className={rootClasses}>
        {title}
        {content}
      </div>
    );
  }
}

MeasureResultCard.defaultProps = {
  computedMeasure: {
    result: {},
    errors: {}
  },
  // maxLength was chosen based on looking at roughly how many digits fit into the div.
  // This is an approximate value that could be refined later.
  maxLength: 6,
  showMetadata: false
};

MeasureResultCard.propTypes = {
  measure: PropTypes.shape({
    // Add more as additional parts of the measure are used.
    metricConfig: PropTypes.shape({
      display: PropTypes.shape({
        label: PropTypes.string,
        decimalPlaces: PropTypes.number,
        asPercent: PropTypes.bool
      })
    })
  }),
  computedMeasure: computedMeasurePropType,
  dataRequestInFlight: PropTypes.bool,

  // NOTE! Ideally we'd refactor withComputedMeasure to optionally
  // take a measure UID which it would use to automatically fetch
  // both the lens and the computedMeasure props.
  // For now, all usages of MeasureResultCard either don't need
  // lens info, or already have the lens data anyway.
  lens: PropTypes.shape({
    name: PropTypes.string
  }),
  maxLength: PropTypes.number, // Can override the measure decimalPlaces.
  showMetadata: PropTypes.bool // Metadata included: Title.
};

export default withComputedMeasure()(MeasureResultCard);
