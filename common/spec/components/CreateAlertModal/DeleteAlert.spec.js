import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

import CreateAlertApi from 'common/components/CreateAlertModal/api/CreateAlertApi';
import DeleteAlert from 'common/components/CreateAlertModal/DeleteAlert';
import { renderComponent } from '../../helpers';


describe('DeleteAlert', () => {
  it('renders an element', () => {
    const spy = sinon.spy();
    const element = renderComponent(DeleteAlert, { onCancel: spy, alert: {} });

    assert.isNotNull(element);
  });

  it('should render a modal with yes & cancel button', () => {
    const spy = sinon.spy();
    const element = renderComponent(DeleteAlert, { onCancel: spy, alert: {} });

    assert.isNotNull(element.querySelector('.yes-button'));
    assert.isNotNull(element.querySelector('.cancel-button'));
  });

  it('should call delete alert promise on yes button click', () => {
    const spy = sinon.spy();
    const deleteAlertPromise = sinon.stub(CreateAlertApi, 'deleteAlert').returns(Promise.resolve({ status: 200 }));
    const element = renderComponent(DeleteAlert, { onCancel: spy, alert: {} });
    const yesButton = element.querySelector('.yes-button');

    TestUtils.Simulate.click(yesButton);

    sinon.assert.calledOnce(deleteAlertPromise);
    deleteAlertPromise.restore();
  });

  it('should call onCancel function on cancel button click', () => {
    const spy = sinon.spy();
    const element = renderComponent(DeleteAlert, { onCancel: spy, alert: {} });
    const cancelButton = element.querySelector('.cancel-button');

    TestUtils.Simulate.click(cancelButton);

    sinon.assert.calledOnce(spy);
  });
});
