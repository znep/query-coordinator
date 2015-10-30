describe('FormSelectInput', function() {

  var components = blist.namespace.fetch('blist.components');
  var FormSelectInput = components.FormSelectInput;
  var FormInput = components.FormInput;
  var TestUtils = React.addons.TestUtils;
  var findByTag = TestUtils.findRenderedDOMComponentWithTag;
  var findAllByTag = TestUtils.scryRenderedDOMComponentsWithTag;

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
    expect(this.createElement()).to.be.a.reactElement;
  });

  it('renders', function() {
    this.shallowRenderer.render(this.createElement());
    var result = this.shallowRenderer.getRenderOutput();
    expect(result).to.be.an.elementOfType(FormInput);
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
    expect(option).to.have.textContent('Choose something');
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
    expect(option1).to.have.textContent('one');
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
    expect(option2).to.have.textContent('two');
    expect(option2.value).to.eq('dos');
    expect(option2.selected).to.eq(true);
  });

});
