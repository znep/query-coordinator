import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import TestUtils, {
  findRenderedDOMComponentWithTag as findByTag,
  scryRenderedDOMComponentsWithTag as findAllByTag
} from 'react-dom/test-utils';
import { createRenderer } from 'react-test-renderer/shallow';

import FormInput from 'components/form-input';

describe('FormInput', function() {

  beforeEach(function() {
    this.shallowRenderer = createRenderer();
    this.onSuccessStub = sinon.stub();
    sinon.stub($, 't').callsFake(function(key) {
      return 'Translation for: ' + key;
    });
    this.props = {
      description: 'my description',
      id: 'id',
      label: 'my input'
    };
    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(FormInput, props, React.createElement('h1', null, 'Hello, world!'));
    };
    this.renderIntoDocument = function(props) {
      return TestUtils.renderIntoDocument(this.createElement(props));
    };
  });

  afterEach(function() {
    $.t.restore();
  });

  it('exists', function() {
    assert.isNotNull(this.createElement());
  });

  it('renders', function() {
    this.shallowRenderer.render(this.createElement());
    var result = this.shallowRenderer.getRenderOutput();
    assert.isNotNull(result);
  });

  it('has a label', function() {
    var node = this.renderIntoDocument();
    var label = findAllByTag(node, 'label')[0];
    assert.equal(label.textContent, 'my input');
  });

  it('shows validation errors', function() {
    var node = this.renderIntoDocument({
      showValidationError: true,
      validationError: 'error message'
    });
    var label = findAllByTag(node, 'label')[1];
    assert.equal(label.textContent, 'error message');
  });

  it('has a description', function() {
    var node = this.renderIntoDocument();
    var option = findByTag(node, 'p');
    assert.equal(option.textContent, 'my description');
  });

  it('can be required', function() {
    var node = this.renderIntoDocument({
      required: true
    });
    var label = findAllByTag(node, 'label')[0];
    assert.isTrue(label.classList.contains('required'));
  });

});
