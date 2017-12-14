import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classnames from 'classnames';

import I18n from 'common/i18n';
import { formatNumber } from 'common/js_utils';

import withComputedMeasure from './withComputedMeasure';

// Calculates and displays a measure as a tile
export class MeasureResultCard extends Component {

  renderData() {
    const { computedMeasure, dataRequestInFlight, placeholder } = this.props;
    const result = _.get(computedMeasure, 'result'); // as a String from toFixed()
    const dividingByZero = _.get(computedMeasure, 'dividingByZero');
    const asPercent = _.get(this.props, 'measure.metric.display.asPercent', false);
    // Default value of -1 for decimalPlaces indicates that no precision was set.
    const decimalPlaces = _.get(this.props, 'measure.metric.display.decimalPlaces', -1);

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
      let formatted = result;
      const parts = result.split('.');

      // MAX_RESULT_CHARS was chosen based on looking at roughly how many digits fit into the div.
      // This is an approximate value that could be refined later.
      const MAX_RESULT_CHARS = 11;

      if (parts[0].length > 9) {
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
      if (formatted.length > MAX_RESULT_CHARS) {
        formatted = formatted.substring(0, MAX_RESULT_CHARS);
      }
      return (
        <div className={resultClassNames} title={formatted}>{formatted}</div>
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
        decimalPlaces: PropTypes.number,
        asPercent: PropTypes.bool
      })
    })
  }).isRequired,
  placeholder: PropTypes.string,
  computedMeasure: PropTypes.object, // See withComputedMeasure.
  dataRequestInFlight: PropTypes.bool
};

export default withComputedMeasure()(MeasureResultCard);
