import { mount } from 'enzyme';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

import AdvancedAlert from 'common/components/CreateAlertModal/AdvancedAlert';

describe('AdvancedAlert', () => {
  it('renders an element', () => {
    const spy = sinon.spy();
    const element = mount(<AdvancedAlert onRawSoqlQueryChange={spy} />);

    assert.isDefined(element);
  });

  it('should render text area for raw soql input', () => {
    const spy = sinon.spy();
    const element = mount(<AdvancedAlert onRawSoqlQueryChange={spy} />);

    assert.isTrue(element.find('.advance-alert').exists());
    assert.isTrue(element.find('#alert-raw-query').exists());
  });

  it('should call onRawSoqlQueryChange function on soql input change', () => {
    const spy = sinon.spy();
    const element = mount(<AdvancedAlert onRawSoqlQueryChange={spy} />);

    element.find('#alert-raw-query').simulate('change');

    sinon.assert.calledOnce(spy);
  });
});
