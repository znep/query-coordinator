import React from 'react';
import TestUtils, {
  findRenderedDOMComponentWithTag as findByTag,
  scryRenderedDOMComponentsWithTag as findAllByTag
} from 'react-addons-test-utils';

import FormInput from 'components/form-input';

describe('FormInput', function() {

  beforeEach(function() {
    this.shallowRenderer = TestUtils.createRenderer();
    this.onSuccessStub = sinon.stub();
    sinon.stub($, 't', function(key) {
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
    expect(this.createElement()).to.be.a.reactElement;
  });

  it('renders', function() {
    this.shallowRenderer.render(this.createElement());
    var result = this.shallowRenderer.getRenderOutput();
    expect(result).to.be.an.elementOfType('div');
  });

  it('has a label', function() {
    var node = this.renderIntoDocument();
    var label = findAllByTag(node, 'label')[0];
    expect(label).to.have.textContent('my input');
  });

  it('shows validation errors', function() {
    var node = this.renderIntoDocument({
      showValidationError: true,
      validationError: 'error message'
    });
    var label = findAllByTag(node, 'label')[1];
    expect(label).to.have.textContent('error message');
  });

  it('has a description', function() {
    var node = this.renderIntoDocument();
    var option = findByTag(node, 'p');
    expect(option).to.have.textContent('my description');
  });

  it('can be required', function() {
    var node = this.renderIntoDocument({
      required: true
    });
    var label = findAllByTag(node, 'label')[0];
    expect(label).to.have.className('required');
  });

});
