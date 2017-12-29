import TestUtils from 'react-dom/test-utils';
import CreateAlertModal from 'common/components/CreateAlertModal';
import CreateAlertApi from 'common/components/CreateAlertModal/api/CreateAlertApi';
import { renderComponent } from '../../helpers';
import React, { Component } from 'react';
import { mount } from 'enzyme';

describe('CreateAlertModal', () => {
  it('renders an element', () => {
    const spy = sinon.spy();
    const element = renderComponent(CreateAlertModal, { onClose: spy });
    assert.isNotNull(element);
  });

  it('should renders an Modal with name, query inputs', () => {
    const spy = sinon.spy();
    const element = renderComponent(CreateAlertModal, { onClose: spy });
    assert.isNotNull(element.querySelectorAll('.create-alert-modal'));
    assert.isNotNull(element.querySelectorAll('.alert-name-section'));
    assert.isNotNull(element.querySelectorAll('textarea'));
  });


  it('on save should call create alert promise', () => {
    const spy = sinon.spy();
    let createAlertPromise = sinon.stub(CreateAlertApi, 'create').returns(Promise.resolve({ status: 200 }));
    let element = mount(<CreateAlertModal onClose={spy} />);
    let saveButton = element.find('.create-button');
    element.setState({ alertName: 'alert' });
    saveButton.simulate('click');
    sinon.assert.calledOnce(createAlertPromise);
    createAlertPromise.restore();
  });

  it('on validate should call validate soql query promise', () => {
    const spy = sinon.spy();
    const element = renderComponent(CreateAlertModal, { onClose: spy });
    let validateButton = element.querySelector('.validate-button');
    let validateAlertPromise = sinon.stub(CreateAlertApi, 'validate').returns(Promise.resolve({ status: 200 }));
    TestUtils.Simulate.click(validateButton);
    sinon.assert.calledOnce(validateAlertPromise);
    validateAlertPromise.restore();
  });

  it('it should call onClose method while dismiss', () => {
    const spy = sinon.spy();
    const element = renderComponent(CreateAlertModal, { onClose: spy });
    let closeButton = element.querySelector('.modal-header-dismiss');
    TestUtils.Simulate.click(closeButton);
    sinon.assert.calledOnce(spy);
  });

  it('should show deleted button if edit mode is on', () => {
    const spy = sinon.spy();
    const element = renderComponent(CreateAlertModal, { onClose: spy, editMode: true });
    assert.isNotNull(element.querySelectorAll('.delete-button'));
  });

});
