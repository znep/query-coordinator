import React, { Component } from 'react';
import { renderComponent } from '../../helpers';
import CreateAlertApi from 'common/components/CreateAlertModal/api/CreateAlertApi';
import DeleteView from 'common/components/CreateAlertModal/DeleteView';
import TestUtils from 'react-dom/test-utils';

describe('DeleteView', () => {
  it('renders an element', () => {
    const spy = sinon.spy();
    const element = renderComponent(DeleteView, { onCancel: spy, alert: {} });
    assert.isNotNull(element);
  });

  it('should renders an Modal with yes & cancel button', () => {
    const spy = sinon.spy();
    const element = renderComponent(DeleteView, { onCancel: spy, alert: {} });
    assert.isNotNull(element.querySelector('.yes-button'));
    assert.isNotNull(element.querySelector('.cancel-button'));
  });

  it('on yes should call delete alert promise', () => {
    const spy = sinon.spy();
    let createAlertPromise = sinon.stub(CreateAlertApi, 'delete').returns(Promise.resolve({ status: 200 }));
    const element = renderComponent(DeleteView, { onCancel: spy, alert: {} });
    let yesButton = element.querySelector('.yes-button');
    TestUtils.Simulate.click(yesButton);
    sinon.assert.calledOnce(createAlertPromise);
    createAlertPromise.restore();
  });

  it('on cancel should call onCancel function', () => {
    const spy = sinon.spy();
    const element = renderComponent(DeleteView, { onCancel: spy, alert: {} });
    let cancelButton = element.querySelector('.cancel-button');

    TestUtils.Simulate.click(cancelButton);
    sinon.assert.calledOnce(spy);
  });

});
