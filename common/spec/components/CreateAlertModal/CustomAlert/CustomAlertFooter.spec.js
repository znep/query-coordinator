import TestUtils from 'react-dom/test-utils';
import CustomAlertFooter from 'common/components/CreateAlertModal/CustomAlert/CustomAlertFooter';
import { renderComponent } from '../../../helpers';
import React, { Component } from 'react';
import { mount } from 'enzyme';

describe('CustomAlertFooter', () => {

  it('renders an element', () => {
    const element = renderComponent(CustomAlertFooter);
    assert.isNotNull(element);
  });

  it('should renders element with save, delete, back button and name filed', () => {
    let element = mount(<CustomAlertFooter />);
    element.setState({
      showSaveButton: true,
      showDeleteButton: true,
      showBackButton: true,
      showNameField: true
    });
    assert.isNotNull(element.find('input'));
    assert.isNotNull(element.find('.delete-button'));
    assert.isNotNull(element.find('.back-button'));
    assert.isNotNull(element.find('.validate-button'));
    assert.isNotNull(element.find('.create-button'));
  });

  describe('name filed change', () => {
    it('should call on alert name change function ', () => {
      const nameChangeSpy = sinon.spy();
      let element = mount(<CustomAlertFooter onAlertNameChange={nameChangeSpy} />);
      element.setState({ showNameField: true });
      element.find('input').simulate('change');
      sinon.assert.calledOnce(nameChangeSpy);
    });
  });

  describe('delete button', () => {

    it('should call onDelete props function on click ', () => {
      const onDeleteSpy = sinon.spy();
      let element = mount(<CustomAlertFooter onDeleteClick={onDeleteSpy} />);
      element.setState({ showDeleteButton: true });
      element.find('.delete-button').simulate('click');
      sinon.assert.calledOnce(onDeleteSpy);
    });
  });

  describe('Validate button', () => {

    it('should call onValidate props function on click ', () => {
      const onValidateClickSpy = sinon.spy();
      let element = mount(<CustomAlertFooter onValidateClick={onValidateClickSpy} />);
      element.setState({ showValidateButton: true });
      element.find('.validate-button').simulate('click');
      sinon.assert.calledOnce(onValidateClickSpy);
    });
  });

  describe('back button', () => {

    it('should call onPageChange props function on click ', () => {
      const onPageChangeSpy = sinon.spy();
      let element = mount(<CustomAlertFooter onPageChange={onPageChangeSpy} />);
      element.setState({ showBackButton: true });
      element.find('.back-button').simulate('click');
      sinon.assert.calledOnce(onPageChangeSpy);
    });
  });

  describe('save button', () => {

    it('should call onSave props function on click ', () => {
      const onSaveSpy = sinon.spy();
      const props = {
        onSaveClick: onSaveSpy,
        customAlertTriggerType: 'customAlert',
        alertName: 'test'
      };
      let element = mount(<CustomAlertFooter {...props} />);
      element.setState({ showSaveButton: true });
      element.find('.create-button').simulate('click');
      sinon.assert.calledOnce(onSaveSpy);
    });

    it('should not call onSave props function on click ', () => {
      const onSaveSpy = sinon.spy();
      let element = mount(<CustomAlertFooter onSaveClick={onSaveSpy} enableSaveButton={false} />);
      element.setState({ showSaveButton: true });
      element.find('.create-button').simulate('click');
      sinon.assert.notCalled(onSaveSpy);
    });

    it('should call onPageChange props function on click ', () => {
      const onPageChangeSpy = sinon.spy();
      let disableNextButton = false;
      let element = mount(<CustomAlertFooter onPageChange={onPageChangeSpy} />);
      element.setState({ showSaveButton: false, nextPage: 'test' });
      element.find('.create-button').simulate('click');
      sinon.assert.calledOnce(onPageChangeSpy);
    });
  });

});
