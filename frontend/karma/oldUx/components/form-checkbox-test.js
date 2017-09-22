import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils, {
  findRenderedDOMComponentWithClass as findByClass
} from 'react-dom/test-utils';
import { createRenderer } from 'react-test-renderer/shallow';

import FormCheckbox from 'components/form-checkbox';

describe('FormCheckbox', function() {
  beforeEach(function() {
    this.shallowRenderer = createRenderer();
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
    assert.ok(this.createElement());
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
      sinon.assert.calledOnce($.ajax);
      sinon.assert.calledOnce(this.onSuccessStub);
    });
  });
});
