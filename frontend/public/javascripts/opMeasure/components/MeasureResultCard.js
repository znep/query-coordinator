import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classnames from 'classnames';

import I18n from 'common/i18n';

import withComputedMeasure from './withComputedMeasure';

// Calculates and displays a measure as a tile
export class MeasureResultCard extends Component {

  renderData() {
    const { computedMeasure, dataRequestInFlight, placeholder } = this.props;
    const result = _.get(computedMeasure, 'result');
    const dividingByZero = _.get(computedMeasure, 'dividingByZero');
    const asPercent = _.get(this.props, 'measure.metric.display.asPercent', false);

    if (dividingByZero) {
      return (
        <div className="measure-dividing-by-zero">
          {I18n.t('open_performance.measure.dividing_by_zero')}
        </div>
      );
    } else if (result) {
      const resultClassNames = classnames(
        'measure-result-big-number',
        { percent: asPercent }
      );
      return (
        <div className={resultClassNames} title={result}>{result}</div>
      );
    } else if (dataRequestInFlight) {
      return (
        <div className="spinner"></div>
      );
    } else {
      return (
        <div className="measure-result-placeholder">{placeholder}</div>
      );
    }
  }

  render() {
    const subtitle = _.get(this.props, 'measure.metric.display.label', '');

    return (
      <div className="measure-result-card">
        {this.renderData()}
        <div className="measure-result-subtitle">
          {subtitle}
        </div>
      </div>
    );
  }
}

MeasureResultCard.defaultProps = {
  placeholder: ''
};

MeasureResultCard.propTypes = {
  measure: PropTypes.shape({
    // Add more as additional parts of the measure are used.
    metric: PropTypes.shape({
      display: PropTypes.shape({
        label: PropTypes.string,
        asPercent: PropTypes.bool
      })
    })
  }).isRequired,
  placeholder: PropTypes.string,
  computedMeasure: PropTypes.object, // See withComputedMeasure.
  dataRequestInFlight: PropTypes.bool
};

export default withComputedMeasure()(MeasureResultCard);
