import React from 'react';
import TestUtils from 'react-addons-test-utils';

import renderComponent from './renderComponent';
import { AuthoringWorkflow } from 'src/authoringWorkflow/AuthoringWorkflow';
import vifs from 'src/authoringWorkflow/vifs';

function defaultProps() {
  return {
    vifAuthoring: {
      authoring: {
        selectedVisualizationType: 'columnChart',
      },
      vifs: {
        columnChart: vifs().columnChart
      }
    }
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
    var props = defaultProps();

    // Make a valid visualization
    _.set(props.vifAuthoring.vifs.columnChart, 'series[0].dataSource.domain', 'something');
    _.set(props.vifAuthoring.vifs.columnChart, 'series[0].dataSource.datasetUid', 'something');
    _.set(props.vifAuthoring.vifs.columnChart, 'series[0].dataSource.dimension.columnName', 'something');

    var element = renderComponent(AuthoringWorkflow, _.merge(props, {
      onComplete: onComplete
    }));

    sinon.assert.notCalled(onComplete);
    TestUtils.Simulate.click(element.querySelector('button.done'));
    sinon.assert.calledOnce(onComplete);
    sinon.assert.calledWithExactly(onComplete, { vif: props.vif });

  });

  it('calls the onCancel callback when the cancel button is clicked', function() {
    var onCancel = sinon.spy();

    var element = renderComponent(AuthoringWorkflow, _.merge(defaultProps(), {
      onCancel: onCancel
    }));

    sinon.assert.notCalled(onCancel);
    TestUtils.Simulate.click(element.querySelector('button.cancel'));
    sinon.assert.calledOnce(onCancel);
  });
});
