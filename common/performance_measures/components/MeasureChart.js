import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import moment from 'moment';
import classNames from 'classnames';

import I18n from 'common/i18n';
import { components } from 'common/visualizations';
import SocrataIcon from 'common/components/SocrataIcon';

import { MeasureTitle } from './MeasureTitle';
import { CalculationTypeNames, PeriodTypes } from '../lib/constants';
import withComputedMeasure from './withComputedMeasure';
import computedMeasurePropType from '../propTypes/computedMeasurePropType';

export class MeasureChart extends Component {

  generateVifFromMeasure(measure, computedMeasure) {
    const { metricConfig } = measure;
    const { series } = computedMeasure;

    const reportingPeriodStartDate = _.get(metricConfig, 'reportingPeriod.startDate');
    const reportingPeriodType = _.get(metricConfig, 'reportingPeriod.type');
    const reportingPeriodSize = _.get(metricConfig, 'reportingPeriod.size');
    const dateColumn = _.get(metricConfig, 'dateColumn');
    const calculationType = _.get(metricConfig, 'type');
    const dataSourceLensUid = _.get(measure, 'dataSourceLensUid');

    // Not enough info to draw a visualization
    const requiredFields = [
      reportingPeriodStartDate,
      reportingPeriodType,
      reportingPeriodSize,
      dateColumn,
      dataSourceLensUid
    ];

    if (!_.every(requiredFields)) {
      return null;
    }

    const timestampWithoutZone = 'YYYY-MM-DDTHH:mm:ss.SSS';
    const today = moment().format(timestampWithoutZone);
    const startDate = moment(reportingPeriodStartDate).format(timestampWithoutZone);
    const pointStyle = reportingPeriodType === PeriodTypes.OPEN ? 'last-open' : 'closed';
    const useCountAggregation = calculationType === CalculationTypeNames.COUNT;

    return {
      configuration: {
        dimensionAxisMinValue: startDate,
        dimensionAxisMaxValue: today,
        viewSourceDataLink: true
      },
      origin: {
        url: `/d/${dataSourceLensUid}`// how do we get domain for embeds?
      },
      series: [
        {
          lineStyle: {
            points: pointStyle,
            pointRadius: 4
          },
          dataSource: {
            precision: reportingPeriodSize.toUpperCase(),
            dimension: {
              columnName: dateColumn,
              aggregationFunction: null
            },
            measure: {
              // KPIs should set each measure columnName to something unique.
              columnName: `${calculationType}_for_${dataSourceLensUid}`,
              aggregationFunction: useCountAggregation ? CalculationTypeNames.COUNT : CalculationTypeNames.SUM
            },
            type: 'socrata.inline',
            rows: series
          },
          label: _.get(metricConfig, 'display.label'),
          type: 'timelineChart',
          unit: {
            one: 'incident', // TODO: add a one / other input field for measures
            other: _.get(metricConfig, 'display.label')
          }
        }
      ],
      createdAt: today, // does this date matter?
      format: {
        type: 'visualization_interchange_format',
        version: 2
      }
    };
  }

  renderTitle() {
    const { showMetadata, lens, measure } = this.props;
    if (!showMetadata) {
      return null;
    }

    return <MeasureTitle lens={lens} measure={measure} />;
  }

  renderChart(series) {
    if (!series) {
      return null;
    }

    const vif = this.generateVifFromMeasure(this.props.measure, this.props.computedMeasure);

    if (!vif) {
      return null;
    }

    return <components.Visualization vif={vif} />;
  }

  renderPlaceholder() {
    return (
      <div className="measure-result-placeholder">
        <SocrataIcon name="line-chart" />
        <div className="measure-result-placeholder-text">
          {I18n.t('shared.performance_measures.no_visualization')}
        </div>
      </div>
    );
  }

  render() {
    const { measure, computedMeasure, dataRequestInFlight, showMetadata } = this.props;
    const { series } = computedMeasure;
    const onlyNullValues = _.chain(series)
      .map((pairs) => pairs[1])
      .pull(null)
      .isEmpty()
      .value();

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
      'measure-chart',
      {
        'with-metadata': showMetadata
      }
    );

    const title = busy ? null : this.renderTitle();

    // TODO: Ideally we can render a blank timeline chart with the date range applied, however the
    // current implementation of SvgTimelineChart does not play well with no data (error states, flyouts),
    // so we'll have to carefully introduce that capability later
    // For now, prevent the metric viz chart from rendering if only null data is available
    let content = onlyNullValues ? this.renderPlaceholder() : this.renderChart(series);
    content = busy ? spinner : content;

    return (
      <div className={rootClasses}>
        {title}
        {content}
      </div>
    );
  }
}

MeasureChart.propTypes = {
  measure: PropTypes.shape({
    vif: PropTypes.object // TODO: Q: Should the measure have a vif?
  }),
  computedMeasure: computedMeasurePropType,
  dataRequestInFlight: PropTypes.bool,
  showMetadata: PropTypes.bool // Metadata included: Title.
};

MeasureChart.defaultProps = {
  computedMeasure: {
    result: {},
    errors: {}
  },
  // NOTE! Ideally we'd refactor withComputedMeasure to optionally
  // take a measure UID which it would use to automatically fetch
  // both the lens and the computedMeasure props.
  // For now, all usages of MeasureResultCard either don't need
  // lens info, or already have the lens data anyway.
  lens: PropTypes.shape({
    name: PropTypes.string
  }),
  showMetadata: false
};

const includeSeries = true;
export default withComputedMeasure(includeSeries)(MeasureChart);
