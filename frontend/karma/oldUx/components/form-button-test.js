import sinon from 'sinon';
import { assert } from 'chai';
import React from 'react';
import TestUtils, {
  findRenderedDOMComponentWithTag as findByTag
} from 'react-dom/test-utils';
import { createRenderer } from 'react-test-renderer/shallow';

import FormButton from 'components/form-button';

describe('FormButton', function() {

  beforeEach(function() {
    this.target = $('<div/>').appendTo(document.body).get(0);
    this.shallowRenderer = createRenderer();
    this.onSuccessStub = sinon.stub();
    this.props = {
      action: '/foo',
      authenticityToken: 'abcd',
      method: 'put',
      onSuccess: this.onSuccessStub,
      value: 'Click'
    };
    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(FormButton, props);
    };
    this.renderIntoDocument = function(props) {
      return TestUtils.renderIntoDocument(this.createElement(props));
    };
  });

  afterEach(function() {
    $(this.target).remove();
  });

  it('exists', function() {
    assert.ok(this.createElement());
  });

  it('renders', function() {
    this.shallowRenderer.render(this.createElement());
    var result = this.shallowRenderer.getRenderOutput();
    assert.ok(result);
  });

  describe('rendered', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument();
      sinon.stub($, 'ajax').yieldsTo('success', {
        success: true,
        message: 'message'
      });
    });

    afterEach(function() {
      $.ajax.restore();
    });

    it('makes an ajax call on submit', function() {
      TestUtils.Simulate.submit(findByTag(this.node, 'form'));
      sinon.assert.calledOnce($.ajax);
      sinon.assert.calledOnce(this.onSuccessStub);
    });
  });
});
