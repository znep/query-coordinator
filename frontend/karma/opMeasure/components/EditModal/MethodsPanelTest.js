import { assert } from 'chai';
import sinon from 'sinon';
import { Simulate } from 'react-dom/test-utils';

import { MethodsPanel } from 'components/EditModal/MethodsPanel';

describe('MethodsPanel', () => {
  const getProps = (props) => {
    return {
      analysis: 'example analysis text',
      methods: 'example methods text',
      onChangeAnalysis: _.noop,
      onChangeMethods: _.noop,
      ...props
    };
  };

  it('renders', () => {
    const element = renderComponent(MethodsPanel, getProps());
    assert.ok(element);
  });

  it('updates the analysis state value when the analysis field value is changed', () => {
    const spy = sinon.spy();
    const element = renderComponent(MethodsPanel, getProps({
      onChangeAnalysis: spy
    }));

    sinon.assert.notCalled(spy);
    Simulate.change(element.querySelector('#analysis'), 'new analysis');
    sinon.assert.calledOnce(spy);
  });

  it('updates the methods state value when the methods field value is changed', () => {
    const spy = sinon.spy();
    const element = renderComponent(MethodsPanel, getProps({
      onChangeMethods: spy
    }));

    sinon.assert.notCalled(spy);
    Simulate.change(element.querySelector('#methods'), 'new methods');
    sinon.assert.calledOnce(spy);
  });
});
