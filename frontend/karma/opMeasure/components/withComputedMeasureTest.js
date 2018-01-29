import _ from 'lodash';
import { shallow } from 'enzyme';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { assert } from 'chai';
import sinon from 'sinon';

import withComputedMeasure from 'opMeasure/components/withComputedMeasure';

describe('withComputedMeasure', () => {
  const MockComponent = () => <div />;
  MockComponent.displayName = 'MockComponent';
  let measure;

  beforeEach(() => {
    measure = {};
    _.set(measure, 'metricConfig.dataSource.uid', 'test-test');
    _.set(measure, 'metricConfig.arguments.column', 'column A');
    _.set(measure, 'metricConfig.type', 'count');
  });

  describe('when includeSeries is false', () => {
    const includeSeries = false;

    it('provides results to wrapped component', (done) => {
      const calculateMeasure = async (measureToCompute) => {
        assert.deepEqual(measure, measureToCompute);
        return {
          result: {
            value: '33.33',
            numerator: '123'
          }
        };
      };

      const props = { measure };
      const includeSeries = false;
      const Wrapped = withComputedMeasure(includeSeries, calculateMeasure)(MockComponent);
      const element = shallow(<Wrapped {...props} />);

      _.defer(() => {
        const child = element.find('MockComponent');
        const props = child.props();
        assert.equal(props.computedMeasure.result.value, '33.33');
        assert.isFalse(!!props.dataRequestInFlight);
        done();
      });
    });

    it('provides errors to wrapped component', (done) => {
      const calculateMeasure = async (measureToCompute) => {
        assert.deepEqual(measure, measureToCompute);
        return {
          errors: {
            calculationNotConfigured: true
          }
        };
      };

      const props = { measure };
      const Wrapped = withComputedMeasure(includeSeries, calculateMeasure)(MockComponent);
      const element = shallow(<Wrapped {...props} />);

      _.defer(() => {
        const child = element.find('MockComponent');
        const props = child.props();
        assert.equal(props.computedMeasure.errors.calculationNotConfigured, true);
        assert.isFalse(!!props.dataRequestInFlight);
        done();
      });
    });

    it('only accepts 1 request at a time', (done) => {
      let resolvedRequest = null;

      const calculateMeasure = sinon.stub().returns(new Promise((resolve, reject) => {
        resolvedRequest = resolve;
      }));

      const props = { measure };
      const Wrapped = withComputedMeasure(includeSeries, calculateMeasure)(MockComponent);
      const element = shallow(<Wrapped {...props} />);

      // Simulate an 'in-flight' request with an unresolved promise
      sinon.assert.calledOnce(calculateMeasure);

      // Changed from 'count' to 'sum'
      element.setProps({
        ...props,
        measure: {
          metric: {
            dataSource: {
              uid: 'test-test'
            },
            type: 'sum',
            arguments: {
              column: 'foo'
            }
          }
        }
      });

      // Promise is still unresolved even after a state change
      sinon.assert.calledOnce(calculateMeasure);

      resolvedRequest(12345);

      _.defer(() => {
        sinon.assert.calledTwice(calculateMeasure);
        done();
      });
    });

    describe('checkProps', () => {
      it('only calls #onMeasureChanged if measure has changed', () => {
        const props = { measure };
        const Wrapped = withComputedMeasure(includeSeries, async () => null)(MockComponent);
        const element = shallow(<Wrapped {...props} />);

        const spy = sinon.spy(element.instance(), 'onMeasureChanged');
        element.instance().checkProps(props);

        sinon.assert.notCalled(spy);

        element.setProps({
          ...props,
          measure: {
            type: 'another thing'
          }
        });

        sinon.assert.calledOnce(spy);
      });
    });
  });

  describe('when includeSeries is true', () => {
    const includeSeries = true;

    it('provides results with series data to wrapped component', (done) => {
      const calculateMeasure = async (measureToCompute) => {
        assert.deepEqual(measure, measureToCompute);
        return {
          result: {
            value: '33.33',
            numerator: '123'
          }
        };
      };

      const calculateSeries = async (measureToCompute) => {
        assert.deepEqual(measure, measureToCompute);
        return [
          ['2001-01-01T00:00:00.000', '10'],
          ['2001-02-01T00:00:00.000', '20']
        ]
      }

      const props = { measure };
      const Wrapped = withComputedMeasure(includeSeries, calculateMeasure, calculateSeries)(MockComponent);
      const element = shallow(<Wrapped {...props} />);

      _.defer(() => {
        const child = element.find('MockComponent');
        const props = child.props();

        // Regular results are still present
        assert.equal(props.computedMeasure.result.value, '33.33');

        // Along with series data
        assert.deepEqual(
          props.computedMeasure.series,
          [['2001-01-01T00:00:00.000', '10'], ['2001-02-01T00:00:00.000', '20']]
        );
        assert.isFalse(!!props.dataRequestInFlight);
        done();
      });
    });

    it('provides errors to wrapped component', (done) => {
      const calculateMeasure = async (measureToCompute) => {
        assert.deepEqual(measure, measureToCompute);
        return {
          errors: {
            calculationNotConfigured: true
          }
        };
      };

      const props = { measure };
      const Wrapped = withComputedMeasure(includeSeries, calculateMeasure)(MockComponent);
      const element = shallow(<Wrapped {...props} />);

      _.defer(() => {
        const child = element.find('MockComponent');
        const props = child.props();
        assert.equal(props.computedMeasure.errors.calculationNotConfigured, true);
        assert.isFalse(!!props.dataRequestInFlight);
        done();
      });
    });
  });
});
