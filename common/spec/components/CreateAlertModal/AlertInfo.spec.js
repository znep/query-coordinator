import { mount } from 'enzyme';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

import AlertInfo from 'common/components/CreateAlertModal/AlertInfo';

describe('AlertInfo', () => {
  it('renders an element', () => {
    const element = mount(<AlertInfo />);

    assert.isDefined(element);
  });

  it('should show loading message if isLoading is true', () => {
    const props = {
      isLoading: true,
      enableValidationInfo: false
    };
    const element = mount(<AlertInfo {...props} />);

    assert.isTrue(element.find('.loading-message').exists());
  });

  it('should show alert name missing message if alert name is empty', () => {
    const props = {
      enableValidationInfo: true
    };
    const element = mount(<AlertInfo {...props} />);

    assert.isTrue(element.find('.name-error').exists());
  });

  it('should show query invalid message if query validation fails', () => {
    const props = {
      enableValidationInfo: true,
      alertName: 'abc',
      isInvalidQuery: true
    };
    const element = mount(<AlertInfo {...props} />);

    assert.isTrue(element.find('.invalid-query').exists());
  });

  it('should show query valid message if query validation succeeds', () => {
    const props = {
      enableValidationInfo: true,
      alertName: 'abc',
      isInvalidQuery: false
    };
    const element = mount(<AlertInfo {...props} />);

    assert.isTrue(element.find('.valid-query').exists());
  });
});
