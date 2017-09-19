import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import TestUtils, {
  findRenderedDOMComponentWithTag as findByTag,
  scryRenderedDOMComponentsWithTag as findAllByTag
} from 'react-dom/test-utils';
import { createRenderer } from 'react-test-renderer/shallow';

import FormSelectInput from 'components/form-select-input';
import FormInput from 'components/form-input';

describe('FormSelectInput', function() {

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
      return React.createElement(FormSelectInput, props);
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

  it('shows validation errors', function() {
    var node = this.renderIntoDocument({
      required: true,
      validationError: 'error message'
    });
    TestUtils.Simulate.change(findByTag(node, 'select'));
    var formInput = TestUtils.findRenderedComponentWithType(node, FormInput);
    expect(formInput.props.showValidationError).to.eq(true);
  });

  it('has a default option', function() {
    var node = this.renderIntoDocument({
      initialOption: 'Choose something'
    });
    var option = findByTag(node, 'option');
    assert.equal(option.textContent, 'Choose something');
  });

  it('renders the options passed to it', function() {
    var node = this.renderIntoDocument({
      options: [
        { key: '1', label: 'one', value: 'uno' },
        { key: '2', label: 'two', value: 'dos' }
      ]
    });
    var options = findAllByTag(node, 'option');
    expect(options).to.have.length(2);
    var option1 = options[0];
    assert.equal(option1.textContent, 'one');
    expect(option1.value).to.eq('uno');
  });

  it('can have an initial value', function() {
    var node = this.renderIntoDocument({
      initialValue: 'dos',
      options: [
        { key: '1', label: 'one', value: 'uno' },
        { key: '2', label: 'two', value: 'dos' }
      ]
    });
    var options = findAllByTag(node, 'option');
    var option2 = options[1];
    assert.equal(option2.textContent, 'two');
    expect(option2.value).to.eq('dos');
    expect(option2.selected).to.eq(true);
  });

});
