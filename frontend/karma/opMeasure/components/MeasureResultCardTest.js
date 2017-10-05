import _ from 'lodash';
import { shallow } from 'enzyme';
import React from 'react';
import ReactDOM from 'react-dom';
import { assert } from 'chai';
import sinon from 'sinon';

import { MeasureResultCard } from 'components/MeasureResultCard';

describe('MeasureResultCard', () => {
  const unresolvedPromise = new Promise(_.noop);

  const getProps = (props) => {
    return {
      measure: {},
      calculateMeasure: sinon.stub().returns(unresolvedPromise),
      ...props
    };
  };

  it('renders a placeholder if metric is blank', () => {
    const element = shallow(<MeasureResultCard {...getProps()} />);
    assert.lengthOf(element.find('.measure-result-placeholder'), 1);
  });

  it('only accepts 1 request at a time', (done) => {
    let props = getProps();

    _.set(props, 'measure.metric.dataSource.uid', 'test-test');
    _.set(props, 'measure.metric.type', 'count');

    let resolvedRequest = null;

    props.calculateMeasure = sinon.stub().returns(new Promise((resolve, reject) => {
      resolvedRequest = resolve;
    }));

    const element = shallow(<MeasureResultCard {...props} />);

    // Simulate an 'in-flight' request with an unresolved promise
    sinon.assert.calledOnce(props.calculateMeasure);

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
    sinon.assert.calledOnce(props.calculateMeasure);

    resolvedRequest(12345);

    _.defer(() => {
      sinon.assert.calledTwice(props.calculateMeasure);
      done();
    });
  });

  describe('checkProps', () => {
    it('only calls #onMeasureChanged if measure has changed', () => {
      const props = getProps();
      const element = shallow(<MeasureResultCard {...props} />);

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

  describe('isReadyToCalculate', () => {
    describe('for count calculations', () => {
      let props;

      beforeEach(() => {
        props = getProps();
        _.set(props, 'measure.metric.type', 'count');
      });

      it('returns true if dataSource uid is present', () => {
        _.set(props, 'measure.metric.dataSource.uid', 'test-test');
        const element = shallow(<MeasureResultCard {...props} />);

        assert.isTrue(element.instance().isReadyToCalculate(props.measure));
      });

      it('returns false without dataSource uid', () => {
        const element = shallow(<MeasureResultCard {...props} />);

        assert.isFalse(element.instance().isReadyToCalculate(props.measure));
      });
    });

    describe('for sum calculations', () => {
      let props;

      beforeEach(() => {
        props = getProps();
        _.set(props, 'measure.metric.type', 'sum');
      });

      it('returns true if dataSource uid AND column are present', () => {
        _.set(props, 'measure.metric.dataSource.uid', 'test-test');
        _.set(props, 'measure.metric.arguments.column', 'some column name');

        const element = shallow(<MeasureResultCard {...props} />);

        assert.isTrue(element.instance().isReadyToCalculate(props.measure));
      });

      it('returns false without dataSource uid AND column', () => {
        let element;

        _.set(props, 'measure.metric.dataSource.uid', 'test-test');

        element = shallow(<MeasureResultCard {...props} />);
        assert.isFalse(element.instance().isReadyToCalculate(props.measure));

        _.unset(props, 'measure.metric.dataSource.uid');
        _.set(props, 'measure.metric.arguments.column', 'some column name');

        element = shallow(<MeasureResultCard {...props} />);
        assert.isFalse(element.instance().isReadyToCalculate(props.measure));
      });
    });
  });
});
