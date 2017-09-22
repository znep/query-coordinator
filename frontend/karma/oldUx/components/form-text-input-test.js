import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import TestUtils, {
  findRenderedDOMComponentWithTag as findByTag
} from 'react-dom/test-utils';
import { createRenderer } from 'react-test-renderer/shallow';

import FormTextInput from 'components/form-text-input';
import FormInput from 'components/form-input';

describe('FormTextInput', function() {

  beforeEach(function() {
    this.shallowRenderer = createRenderer();
    this.onSuccessStub = sinon.stub();
    sinon.stub($, 't').callsFake(function(key) {
      return 'Translation for: ' + key;
    });
    this.props = {
      id: 'id',
      label: 'my input'
    };
  });

  afterEach(function() {
    $.t.restore();
  });

  it('exists', function() {
    assert.ok(FormTextInput);
  });

  it('renders in a <FormInput />', function() {
    this.shallowRenderer.render(React.createElement(FormTextInput, this.props));
    var result = this.shallowRenderer.getRenderOutput();
    expect(TestUtils.isElementOfType(result, FormInput)).to.eq(true);
  });

  it('has an input', function() {
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, this.props));
    var input = findByTag(node, 'input');
    assert.ok(input);
  });

  it('shows required field validation errors', function() {
    var props = _.extend({
      required: true,
      requiredFieldValidationError: 'error message'
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, props));
    TestUtils.Simulate.change(findByTag(node, 'input'));
    var formInput = TestUtils.findRenderedComponentWithType(node, FormInput);
    expect(formInput.props.showValidationError).to.eq(true);
    expect(formInput.props.validationError).to.eq('error message');
  });

  it('shows content validation errors', function() {
    var props = _.extend({
      initialValue: 'Wombats in Top Hats',
      contentValidator: _.constant({
        valid: false,
        message: 'error message'
      })
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, props));
    TestUtils.Simulate.change(findByTag(node, 'input'));
    var formInput = TestUtils.findRenderedComponentWithType(node, FormInput);
    expect(formInput.props.showValidationError).to.eq(true);
    expect(formInput.props.validationError).to.eq('error message');
  });

  it('can have an initial value', function() {
    var props = _.extend({
      initialValue: 'my value'
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, props));
    var input = findByTag(node, 'input');
    expect(input.value).to.eq('my value');
  });

  it('can be required', function() {
    var props = _.extend({
      required: true
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, props));
    var input = findByTag(node, 'input');
    assert.isTrue(input.classList.contains('required'));
  });

});
