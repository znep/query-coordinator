import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { calculateCountMeasure } from '../measureCalculator';

// Calculates and displays a measure as a tile
export class MeasureResultCard extends Component {
  constructor() {
    super();
    this.state = {};
  }

  componentWillMount() {
    this.checkProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.checkProps(nextProps);
  }

  // When the measure changes, we need to initiate a backend request. If there is
  // already an outstanding request, we defer processing the new measure until
  // the outstanding request completes.
  onMeasureChanged() {
    if (this.state.dataRequestInFlight) {
      // Do nothing - makeRequest() will automatically call checkProps()
      // when the request completes. That will cause onMeasureChanged to be
      // called again (if the measure has indeed changed).
      return;
    }

    this.setState(
      (prevState, props) => ({
        lastRequestedMeasure: props.measure,
        dataRequestInFlight: true
      }),
      this.makeRequest
    );
  }

  // Called whenever props change or the component receives initial props.
  checkProps(props) {
    const measureHasChanged = !_.isEqual(this.state.lastRequestedMeasure, props.measure);
    if (measureHasChanged) {
      this.onMeasureChanged();
    }
  }

  makeRequest() {
    const { measure } = this.props;
    // TODO: Assumes only "count" measures exist. This will change in our next ticket.
    // TODO: Very naive logic checking whether or not measure is "set-up-enough" to render.
    if (_.has(measure, 'metric.dataSource.uid')) {
      this.props.calculator(measure).then(
        (count) => {
          this.setState(
            {
              dataResponse: count,
              dataRequestInFlight: false
            },
            () => this.checkProps(this.props)
          );
        }
      );
    } else {
      this.setState(
        {
          dataResponse: null,
          dataRequestInFlight: false
        },
        () => this.checkProps(this.props)
      );
    }
  }

  renderData() {
    const { dataResponse, dataRequestInFlight } = this.state;

    if (dataResponse) {
      return (
        <div className="measure-result-big-number">{dataResponse}</div>
      );
    } else if (dataRequestInFlight) {
      return (
        <div className="spinner"></div>
      );
    } else {
      return (
        <div className="measure-result-placeholder">PLACEHOLDER measure not set up</div>
      );
    }
  }

  render() {
    const subtitle = _.get(this.props, 'measure.metric.label', '');

    return (<div className="measure-result-card">
      {this.renderData()}
      <div className="measure-result-subtitle">
        {subtitle}
      </div>
    </div>);
  }
}

// Passing in calculator as a prop to allow for dependency injection in tests
MeasureResultCard.defaultProps = {
  calculator: calculateCountMeasure
};

MeasureResultCard.propTypes = {
  measure: PropTypes.shape({
    // Add more as additional parts of the measure are used.
    metric: PropTypes.shape({
      label: PropTypes.string
    })
  }).isRequired,
  calculator: PropTypes.func
};
