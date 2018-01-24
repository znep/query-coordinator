import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';
import { mount } from 'enzyme';

import AlertInfo from 'common/components/CreateAlertModal/AlertInfo';

describe('AlertInfo', () => {

  it('renders an element', () => {
    const element = mount(<AlertInfo />);
    assert.isDefined(element);
  });

  it('should show lodaing message if lodaing is true', () => {
    const element = mount(<AlertInfo isLoading />);
    assert.isTrue(element.find('.loading-message').exists());
  });

  it('should show alert name missing if alert name missing', () => {
    const props = {
      enableValidationInfo: true
    };
    const element = mount(<AlertInfo {...props} />);
    assert.isTrue(element.find('.name-error').exists());
  });

  it('should show query invalid message if query validation failed', () => {
    const props = {
      enableValidationInfo: true,
      alertName: 'abc',
      isInvalidQuery: true
    };
    const element = mount(<AlertInfo {...props} />);
    assert.isTrue(element.find('.invaild-query').exists());
  });

  it('should show query valid message if query validation success', () => {
    const props = {
      enableValidationInfo: true,
      alertName: 'abc',
      isInvalidQuery: false
    };
    const element = mount(<AlertInfo {...props} />);
    assert.isTrue(element.find('.vaild-query').exists());
  });
});
