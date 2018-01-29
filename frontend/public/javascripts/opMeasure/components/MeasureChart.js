import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';
import { SocrataIcon } from 'common/components';

import withComputedMeasure from './withComputedMeasure';
import computedMeasurePropType from '../propTypes/computedMeasurePropType';

export class MeasureChart extends Component {

  renderChart(series) {
    if (!series) return null;

    // TODO: Render the series of data in a SVGTimelineChart
    return null;
  }

  renderPlaceholder() {
    return (
      <div className="measure-result-placeholder">
        <SocrataIcon name="line-chart" />
        <div className="measure-result-placeholder-text">
          {I18n.t('open_performance.no_visualization')}
        </div>
      </div>
    );
  }

  render() {
    const { computedMeasure, dataRequestInFlight } = this.props;
    const { series } = computedMeasure;

    const spinner = (
      <div className="spinner-container">
        <div className="spinner-default spinner-large"></div>
      </div>
    );

    const content = series ?
      this.renderChart(series) :
      this.renderPlaceholder();

    return (
      <div className="measure-chart">
        {dataRequestInFlight ? spinner : content}
      </div>
    );
  }
}

MeasureChart.propTypes = {
  measure: PropTypes.shape({
    vif: PropTypes.object // TODO: Q: Should the measure have a vif?
  }).isRequired,
  computedMeasure: computedMeasurePropType,
  dataRequestInFlight: PropTypes.bool
};

MeasureChart.defaultProps = {
  computedMeasure: {
    result: {},
    errors: {}
  }
};

const includeSeries = true;
export default withComputedMeasure(includeSeries)(MeasureChart);