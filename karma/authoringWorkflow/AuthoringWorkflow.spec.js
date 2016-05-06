var React = require('react');
var ReactDOM = require('react-dom');
var TestUtils = require('react-addons-test-utils');
var AuthoringWorkflow = require('../../src/authoringWorkflow/AuthoringWorkflow');

var renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

describe('AuthoringWorkflow', function() {
  it('renders the done button', function() {
    var element = renderComponent(AuthoringWorkflow);
    expect(element).to.contain('button.done');
  });

  it('renders the cancel button', function() {
    var element = renderComponent(AuthoringWorkflow);
    expect(element).to.contain('button.cancel');
  });

  it('calls the onComplete callback when the done button is clicked', function() {
    var onComplete = sinon.spy();

    var element = renderComponent(AuthoringWorkflow, {
      onComplete: onComplete
    });

    expect(onComplete.callCount).to.equal(0);
    TestUtils.Simulate.click(element.querySelector('button.done'));
    expect(onComplete.callCount).to.equal(1);
  });

  it('calls the onCancel callback when the cancel button is clicked', function() {
    var onCancel = sinon.spy();

    var element = renderComponent(AuthoringWorkflow, {
      onCancel: onCancel
    });

    expect(onCancel.callCount).to.equal(0);
    TestUtils.Simulate.click(element.querySelector('button.cancel'));
    expect(onCancel.callCount).to.equal(1);
  });
});
