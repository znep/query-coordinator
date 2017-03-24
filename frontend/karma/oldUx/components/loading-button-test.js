import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils, {
  findRenderedDOMComponentWithTag as findByTag,
  findRenderedDOMComponentWithClass as findByClass
} from 'react-addons-test-utils';

import LoadingButton from 'components/loading-button';

describe('LoadingButton', function() {

  beforeEach(function() {
    this.shallowRenderer = TestUtils.createRenderer();
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
    expect(this.createElement()).to.be.a.reactElement;
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
      expect(this.button).to.have.className('disabled');
    });

    it('prevents the button click event', function() {
      var mockEvent = { preventDefault: sinon.stub() };
      TestUtils.Simulate.click(this.button, mockEvent);
      expect(mockEvent.preventDefault).to.have.callCount(1);
    });

  });

});
