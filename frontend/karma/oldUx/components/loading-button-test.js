import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils, {
  findRenderedDOMComponentWithTag as findByTag,
  findRenderedDOMComponentWithClass as findByClass
} from 'react-dom/test-utils';
import { createRenderer } from 'react-test-renderer/shallow';

import LoadingButton from 'components/loading-button';

describe('LoadingButton', function() {

  beforeEach(function() {
    this.shallowRenderer = createRenderer();
    this.props = {
    };
    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(LoadingButton, props);
    };
    this.renderIntoDocument = function(props) {
      return TestUtils.renderIntoDocument(this.createElement(props));
    };
  });

  it('exists', function() {
    assert.ok(this.createElement());
  });

  it('renders as a button', function() {
    var node = this.renderIntoDocument();
    expect(ReactDOM.findDOMNode(node).tagName.toLowerCase()).to.eq('button');
  });

  describe('when isLoading=true', function() {

    beforeEach(function() {
      this.node = this.renderIntoDocument({ isLoading: true });
    });

    it('shows the spinner', function() {
      var spinner = findByClass(this.node, 'loading');
      var spinnerStyle = spinner.style;
      expect(spinnerStyle.display).to.eq('block');
    });

  });

  describe('disabled', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument({ disabled: true });
      this.button = findByTag(this.node, 'button');
    });

    it('has the disabled class', function() {
      assert.isTrue(this.button.classList.contains('disabled'));
    });

    it('prevents the button click event', function() {
      var mockEvent = { preventDefault: sinon.stub() };
      TestUtils.Simulate.click(this.button, mockEvent);
      sinon.assert.calledOnce(mockEvent.preventDefault);
    });
  });
});
