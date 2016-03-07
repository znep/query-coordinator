import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils, {
  findRenderedDOMComponentWithClass as findByClass
} from 'react-addons-test-utils';

import FormCheckbox from 'components/form-checkbox';

describe('FormCheckbox', function() {
  beforeEach(function() {
    this.shallowRenderer = TestUtils.createRenderer();
    this.onSuccessStub = sinon.stub();
    this.props = {
      action: '/foo',
      authenticityToken: 'abcd',
      disabled: false,
      method: 'put',
      onSuccess: this.onSuccessStub,
      checked: true
    };
    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(FormCheckbox, props);
    };
    this.renderIntoDocument = function(props) {
      return TestUtils.renderIntoDocument(this.createElement(props));
    };
    this.node = this.renderIntoDocument();
  });

  it('exists', function() {
    expect(this.createElement()).to.be.a.reactElement;
  });

  it('renders', function() {
    expect(_.isElement(ReactDOM.findDOMNode(this.node))).to.eq(true);
  });

  describe('rendered', function() {
    beforeEach(function() {
      sinon.stub($, 'ajax').yieldsTo('success', {
        success: true,
        message: 'message'
      });
    });

    afterEach(function() {
      $.ajax.restore();
    });

    it('makes an ajax call on change', function() {
      TestUtils.Simulate.click(findByClass(this.node, 'form-checkbox'));
      expect($.ajax).to.have.been.calledOnce;
      expect(this.onSuccessStub).to.have.been.calledOnce;
    });
  });
});
