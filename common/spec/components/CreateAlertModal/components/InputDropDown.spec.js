import _ from 'lodash';
import { mount } from 'enzyme';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

import InputDropDown from 'common/components/CreateAlertModal/components/InputDropDown';
import Picklist from 'common/components/Picklist';

describe('InputDropDown', () => {
  let onInputChangeSpy = sinon.spy();
  let onSelectSpy = sinon.spy();

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      onInputChange: onInputChangeSpy,
      onSelect: onSelectSpy
    });
  }

  it('renders an element', () => {
    const element = mount(<InputDropDown />);

    assert.isDefined(element);
  });

  describe('input field', () => {
    it('should render element with input field', () => {
      const element = mount(<InputDropDown {...getProps()} />);

      assert.lengthOf(element.find('input'), 1);
    });

    it('should call onChange props function on click', () => {
      const element = mount(<InputDropDown {...getProps()} />);

      element.find('input').simulate('change');

      sinon.assert.calledOnce(onInputChangeSpy);
    });

    it('should call onBlur function on input field blur', () => {
      const element = mount(<InputDropDown {...getProps()} />);

      element.find('input').simulate('blur');

      assert.equal(element.state().showDropDown, false);
    });

    it('should call onClick function on input field click', () => {
      const element = mount(<InputDropDown {...getProps()} />);

      element.find('input').simulate('click');

      assert.equal(element.state().showDropDown, true);
    });
  });

  describe('onSelect', () => {
    it('should call onSelect props on dropdown selection', () => {
      const props = getProps({ options: [{ title: 'abc', value: 'abc' }] });
      const element = mount(<InputDropDown {...props} />);
      element.setState({ showDropDown : true });

      element.find(Picklist).props().onSelection();

      sinon.assert.calledOnce(onSelectSpy);
    });
  });

});
