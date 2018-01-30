// A React Higher-Order-Component to encapsulate computing a measure.
// https://reactjs.org/docs/higher-order-components.html
// You give it a `measure` prop and it gives you `computedMeasure` and `dataRequestInFlight` props.

import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import airbrake from 'common/airbrake';

import {
  getMetricValue as defaultGetMetricValue,
  getMetricSeries as defaultGetMetricSeries
} from '../measureCalculator';


// Avoid recomputing measures if there's already been a request for the same (reference-equal)
// measure. Avoids recomputation in these common scenarios:
// * Multiple withComputedMeasure components (the Rate editor has 3 on the same measure).
// * Unrelated parts of the state change (open tab, etc).
// and these soon-to-be scenarios:
// * Charts also needing access to computed measures (in addition to MeasureResultCards).
//
// Maps measure object to request promise.
// TODO (if needed later): Don't recompute for non-query-related changes (decimal places, etc).
const computationCache = new Map();

// This function takes a component...
export default function withComputedMeasure(
  includeSeries = false,
  getMetricValue = defaultGetMetricValue, // Allow for dependency injection in tests
  getMetricSeries = defaultGetMetricSeries
) {
  return (WrappedComponent) => {
    const wrappedComponentDisplayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    // ...and returns another component...
    return class extends Component {
      static displayName = `withComputedMeasure(${wrappedComponentDisplayName})`;
      constructor(props) {
        super(props);
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
        const dataResponse = {};

        const handleError = (error) => {
          airbrake.notify({
            error: error,
            context: { component: 'withComputedMeasure' }
          });
          this.setState({
            dataRequestInFlight: false
          });
        };

        const handleSuccess = (response = {}) => {
          this.setState({
            dataResponse: response,
            dataRequestInFlight: false
          },
          () => this.checkProps(this.props));
        };

        const metricValuePromise = _.get(computationCache.get(measure), 'metricValue') ||
                                   getMetricValue(measure);
        const promiseCache = {
          metricValue: metricValuePromise
        };

        if (includeSeries) {
          const metricSeriesPromise = _.get(computationCache.get(measure), 'metricSeries') ||
                                      getMetricSeries(measure);

          promiseCache.metricSeries = metricSeriesPromise;

          Promise.all([metricValuePromise, metricSeriesPromise]).then(
            ([metricValueResult, metricSeriesResult]) => {
              dataResponse.result = metricValueResult.result;
              dataResponse.series = metricSeriesResult;
              dataResponse.errors = metricValueResult.errors;
              handleSuccess(dataResponse);
            },
            handleError
          );
        } else {
          metricValuePromise.then(
            (metricValueResult) => {
              dataResponse.result = metricValueResult.result;
              dataResponse.errors = metricValueResult.errors;
              handleSuccess(dataResponse);
            },
            handleError
          );
        }

        computationCache.set(measure, promiseCache);
      }

      render() {
        return (<WrappedComponent
          computedMeasure={this.state.dataResponse}
          dataRequestInFlight={this.state.dataRequestInFlight}
          {...this.props} />);
      }

      static propTypes = {
        measure: PropTypes.object.isRequired
      };
    };
  };
}
