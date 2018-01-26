import { mount } from 'enzyme';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

import RadiusSlider from 'common/components/CreateAlertModal/components/RadiusSlider';
import Slider from 'common/components/Slider';

describe('RadiusSlider', () => {
  it('renders an element', () => {
    const element = mount(<RadiusSlider />);

    assert.isDefined(element);
  });

  it('should render element with icon and input field', () => {
    const element = mount(<RadiusSlider />);

    assert.lengthOf(element.find('.socrata-icon-arrow-up'), 1);
    assert.lengthOf(element.find('.socrata-icon-arrow-down'), 1);
    assert.lengthOf(element.find(Slider), 1);
  });

  describe('radius slider value change', () => {

    it('should change value on up arrow click', () => {
      const upArrowSpy = sinon.spy();
      const element = mount(<RadiusSlider onChange={upArrowSpy} />);

      element.find('.socrata-icon-arrow-up').simulate('click');

      sinon.assert.calledOnce(upArrowSpy);
    });

    it('should change value on down arrow click', () => {
      const downArrowSpy = sinon.spy();
      const element = mount(<RadiusSlider onChange={downArrowSpy} />);

      element.find('.socrata-icon-arrow-down').simulate('click');

      sinon.assert.calledOnce(downArrowSpy);
    });

    it('should change value on slider bar click', () => {
      const inputChangeSpy = sinon.spy();
      const element = mount(<RadiusSlider onChange={inputChangeSpy} />);
      const slider = element.find(Slider);

      slider.props().onChange();

      sinon.assert.calledOnce(inputChangeSpy);
    });
  });
});
