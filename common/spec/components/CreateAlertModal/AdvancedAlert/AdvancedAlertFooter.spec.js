import { mount } from 'enzyme';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

import AdvancedAlertFooter from 'common/components/CreateAlertModal/AdvancedAlert/AdvancedAlertFooter';

describe('AdvancedAlertFooter', () => {
  it('renders an element', () => {
    const spy = sinon.spy();
    const element = mount(<AdvancedAlertFooter onValidate={spy} />);

    assert.isDefined(element);
  });

  it('should render element with validate, save button and input field', () => {
    const spy = sinon.spy();
    const element = mount(<AdvancedAlertFooter onValidate={spy} />);

    assert.lengthOf(element.find('.validate-button'), 1);
    assert.lengthOf(element.find('.create-button'), 1);
    assert.lengthOf(element.find('input'), 1);
  });

  describe('validate button', () => {
    it('should call onValidate props function on click', () => {
      const spy = sinon.spy();
      const element = mount(<AdvancedAlertFooter onValidate={spy} />);

      element.find('.validate-button').simulate('click');

      sinon.assert.calledOnce(spy);
    });
  });

  describe('save button', () => {
    it('should call onSave props function on click', () => {
      const spy = sinon.spy();
      const props = {
        alertName: 'test',
        enableSaveButton: true,
        onAlertNameChange: spy,
        onSave: spy,
        onValidate: spy
      };
      const element = mount(<AdvancedAlertFooter {...props} />);

      element.find('.create-button').simulate('click');

      sinon.assert.calledOnce(spy);
    });

    it('should not call onSave props function on click if enableSaveButton is false', () => {
      const spy = sinon.spy();
      const saveSpy = sinon.spy();
      const element = mount(<AdvancedAlertFooter onSave={saveSpy} onValidate={spy} />);

      element.find('.create-button').simulate('click');

      sinon.assert.notCalled(saveSpy);
    });
  });

  describe('delete button', () => {
    it('should show delete button', () => {
      const spy = sinon.spy();
      const props = { showDeleteButton: true, onValidate: spy };
      const element = mount(<AdvancedAlertFooter {...props} />);

      assert.lengthOf(element.find('.delete-button'), 1);
    });

    it('should not show delete button if showDeleteButton is false', () => {
      const spy = sinon.spy();
      const element = mount(<AdvancedAlertFooter onValidate={spy} />);

      assert.lengthOf(element.find('.delete-button'), 0);
    });

    it('should call onDelete props function on click', () => {
      const spy = sinon.spy();
      const validateSpy = sinon.spy();
      const props = { showDeleteButton: true, onDelete: spy, onValidate: validateSpy };
      const element = mount(<AdvancedAlertFooter {...props} />);
      assert.lengthOf(element.find('.delete-button'), 1);

      element.find('.delete-button').simulate('click');

      sinon.assert.calledOnce(spy);
    });
  });

});
