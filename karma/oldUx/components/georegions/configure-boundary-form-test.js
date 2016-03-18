import React from 'react';
import TestUtils, {
  findRenderedDOMComponentWithTag as findByTag,
  scryRenderedDOMComponentsWithTag as findAllByTag,
  findRenderedDOMComponentWithClass as findByClass
} from 'react-addons-test-utils';

import ConfigureBoundaryForm from 'components/georegions/configure-boundary-form';

describe('ConfigureBoundaryForm', function() {

  beforeEach(function() {
    this.target = $('<div/>').appendTo(document.body).get(0);
    this.shallowRenderer = TestUtils.createRenderer();
    this.props = {
      authenticityToken: 'authy',
      cancelLabel: 'Cancel',
      id: 12,
      onClose: sinon.stub(),
      onSave: sinon.stub(),
      fetchInitialState: function(complete, success) {
        complete();
        success({name: 'my boundary layer'});
      },
      requiredFields: ['name'],
      saveLabel: 'Save',
      title: 'my title'
    };
    sinon.stub($, 't', function(key) {
      return 'Translation for: ' + key;
    });

    sinon.stub($, 'ajax');
    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(ConfigureBoundaryForm, props);
    };
    this.renderIntoDocument = function(props) {
      return TestUtils.renderIntoDocument(this.createElement(props));
    };
  });

  afterEach(function() {
    $(this.target).remove();
    $.t.restore();
    $.ajax.restore();
  });

  it('exists', function() {
    expect(this.createElement()).to.be.a.reactElement;
  });

  it('renders', function() {
    this.shallowRenderer.render(this.createElement());
    var result = this.shallowRenderer.getRenderOutput();
    expect(result).to.be.an.elementOfType('div');
  });

  it('has a title', function() {
    var node = this.renderIntoDocument();
    var title = findByTag(node, 'h2');
    expect(title).to.have.textContent('my title');
  });

  it('fetches initial state on mount', function() {
    var fetchStub = sinon.stub();
    this.renderIntoDocument({
      fetchInitialState: fetchStub
    });
    expect(fetchStub).to.have.been.calledOnce;
  });

  it('shows the spinner when loading', function() {
    var node = this.renderIntoDocument({
      fetchInitialState: _.noop
    });
    var spinner = findByClass(node, 'georegion-spinner');
    expect(spinner.style.display).to.eq('block');
  });

  it('hides the spinner when not loading', function() {
    var fetchStub = sinon.stub();
    var node = this.renderIntoDocument({
      fetchInitialState: fetchStub
    });
    var spinner = findByClass(node, 'georegion-spinner');
    expect(spinner.style.display).to.eq('block');
    fetchStub.firstCall.args[0]();
    expect(spinner.style.display).to.eq('none');
  });

  describe('validating the form', function() {
    var node;
    var input;
    var saveButton;

    beforeEach(function() {
      blist.georegions.georegions = [
        { name: 'Giraffes in Suits' }
      ];
      node = this.renderIntoDocument({
        initialState: {
          name: 'name'
        }
      });
      input = findByTag(node, 'input');
      saveButton = findAllByTag(node, 'button')[1];
    });

    it('disables the save button if no input', function() {
      input.value = '';
      TestUtils.Simulate.change(input);
      expect(saveButton.className).to.include('disabled');
    });

    it('disables the save button if input is not unique', function() {
      input.value = 'Giraffes in Suits';
      TestUtils.Simulate.change(input);
      expect(saveButton.className).to.include('disabled');
    });

    it('enables the save button if input is valid', function() {
      input.value = 'Penguins in Suits';
      TestUtils.Simulate.change(input);
      expect(saveButton.className).to.not.include('disabled');
    });

  });

  it('saves on submit', function() {
    var saveStub = sinon.stub();
    var node = this.renderIntoDocument({
      onSave: saveStub,
      initialState: {
        name: 'name',
        geometryLabel: 'geometryLabel',
        isConfigured: true
      }
    });

    var form = findByTag(node, 'form');
    TestUtils.Simulate.submit(form);
    expect(saveStub).to.have.been.calledOnce;
  });

});
