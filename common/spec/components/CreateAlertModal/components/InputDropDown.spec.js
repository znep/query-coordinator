import { mount } from 'enzyme';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

import InputDropDown from 'common/components/CreateAlertModal/components/InputDropDown';
import Picklist from 'common/components/Picklist';

describe('InputDropDown', () => {
  it('renders an element', () => {
    const element = mount(<InputDropDown />);

    assert.isDefined(element);
  });

  describe('input field', () => {
    it('should render element with input field', () => {
      const element = mount(<InputDropDown />);

      assert.lengthOf(element.find('input'), 1);
    });

    it('should call onChange props function on click', () => {
      const inputChangeSpy = sinon.spy();
      const element = mount(<InputDropDown onInputChange={inputChangeSpy} />);

      element.find('input').simulate('change');

      sinon.assert.calledOnce(inputChangeSpy);
    });

    it('should call onBlur function on input field blur', () => {
      const element = mount(<InputDropDown />);

      element.find('input').simulate('blur');

      assert.equal(element.state().showDropDown, false);
    });

    it('should call onClick function on input field click', () => {
      const element = mount(<InputDropDown />);

      element.find('input').simulate('click');

      assert.equal(element.state().showDropDown, true);
    });
  });

  describe('onSelect', () => {
    it('should call onSelect props on dropdown selection', () => {
      const onSelectStub = sinon.stub();
      const options = [{ title: 'abc', value: 'abc' }];
      const element = mount(<InputDropDown onSelect={onSelectStub} options={options} />);
      element.setState({ showDropDown : true });

      element.find(Picklist).props().onSelection();

      sinon.assert.calledOnce(onSelectStub);
    });
  });

});
