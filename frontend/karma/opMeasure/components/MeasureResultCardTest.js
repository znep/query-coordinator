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
      calculator: sinon.stub().returns(unresolvedPromise),
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
    let resolvedRequest = null;

    props.calculator = sinon.stub().returns(new Promise((resolve, reject) => {
      resolvedRequest = resolve;
    }));

    const element = shallow(<MeasureResultCard {...props} />);

    // Simulate an 'in-flight' request with an unresolved promise
    sinon.assert.calledOnce(props.calculator);

    element.setProps({
      ...props,
      measure: {
        metric: {
          dataSource: {
            uid: 'test-test'
          },
          type: 'something else'
        }
      }
    });

    // Promise is still unresolved even after a state change
    sinon.assert.calledOnce(props.calculator);

    resolvedRequest(12345);

    _.defer(() => {
      sinon.assert.calledTwice(props.calculator);
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
});
