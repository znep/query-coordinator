import React from 'react';
import TestUtils from 'react-addons-test-utils';

import renderComponent from './renderComponent';
import { AuthoringWorkflow, __RewireAPI__ as AuthoringWorkflowAPI } from 'src/authoringWorkflow/AuthoringWorkflow';
import defaultVif from 'src/authoringWorkflow/defaultVif';

function defaultProps() {
  return {
    datasetMetadata: {
      id: 'asdf-qwer'
    },
    vif: defaultVif
  };
}

describe('AuthoringWorkflow', function() {
  it('renders the done button', function() {
    var element = renderComponent(AuthoringWorkflow, defaultProps());
    expect(element).to.contain('button.done');
  });

  it('renders the cancel button', function() {
    var element = renderComponent(AuthoringWorkflow, defaultProps());
    expect(element).to.contain('button.cancel');
  });

  it('renders the modal close button', function() {
    var element = renderComponent(AuthoringWorkflow, defaultProps());
    expect(element).to.contain('.modal-header-dismiss');
  });

  it('calls the onComplete callback when the done button is clicked', function() {
    var onComplete = sinon.spy();

    var element = renderComponent(AuthoringWorkflow, _.merge(defaultProps(), {
      onComplete: onComplete
    }));

    expect(onComplete.callCount).to.equal(0);
    TestUtils.Simulate.click(element.querySelector('button.done'));
    expect(onComplete.callCount).to.equal(1);
  });

  it('calls the onCancel callback when the cancel button is clicked', function() {
    var onCancel = sinon.spy();

    var element = renderComponent(AuthoringWorkflow, _.merge(defaultProps(), {
      onCancel: onCancel
    }));

    expect(onCancel.callCount).to.equal(0);
    TestUtils.Simulate.click(element.querySelector('button.cancel'));
    expect(onCancel.callCount).to.equal(1);
  });
});
