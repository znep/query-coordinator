import React from 'react';
import TestUtils, {
  findRenderedDOMComponentWithTag as findByTag
} from 'react-addons-test-utils';

import FormTextInput from 'components/form-text-input';
import FormInput from 'components/form-input';

describe('FormTextInput', function() {

  beforeEach(function() {
    this.shallowRenderer = TestUtils.createRenderer();
    this.onSuccessStub = sinon.stub();
    sinon.stub($, 't', function(key) {
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
    expect(FormTextInput).to.exist;
  });

  it('renders in a <FormInput />', function() {
    this.shallowRenderer.render(React.createElement(FormTextInput, this.props));
    var result = this.shallowRenderer.getRenderOutput();
    expect(TestUtils.isElementOfType(result, FormInput)).to.eq(true);
  });

  it('has an input', function() {
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, this.props));
    var input = findByTag(node, 'input');
    expect(input).to.exist;
  });

  it('shows validation errors', function() {
    var props = _.extend({
      required: true,
      validationError: 'error message'
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, props));
    TestUtils.Simulate.change(findByTag(node, 'input'));
    var formInput = TestUtils.findRenderedComponentWithType(node, FormInput);
    expect(formInput.props.showValidationError).to.eq(true);
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
    expect(input).to.have.className('required');
  });

});
