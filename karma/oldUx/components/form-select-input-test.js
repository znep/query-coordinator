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
  });

  afterEach(function() {
    $.t.restore();
  });

  it('exists', function() {
    expect(FormSelectInput).to.exist;
  });

  it('renders', function() {
    this.shallowRenderer.render(React.createElement(FormSelectInput, this.props));
    var result = this.shallowRenderer.getRenderOutput();
    expect(TestUtils.isElementOfType(result, FormInput)).to.eq(true);
  });

  it('has a label', function() {
    var node = TestUtils.renderIntoDocument(React.createElement(FormSelectInput, this.props));
    var label = findAllByTag(node, 'label')[0].getDOMNode();
    expect(label).to.exist.and.to.have.textContent('my input');
  });

  it('shows validation errors', function() {
    var props = _.extend({
      required: true,
      validationError: 'error message'
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormSelectInput, props));
    TestUtils.Simulate.change(findByTag(node, 'select'));
    var label = findAllByTag(node, 'label')[1].getDOMNode();
    expect(label).to.exist.and.to.have.textContent('error message');
  });

  it('has a default option', function() {
    var props = _.extend({
      initialOption: 'Choose something'
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormSelectInput, props));
    var option = findByTag(node, 'option').getDOMNode();
    expect(option).to.exist.and.to.have.textContent('Choose something');
  });

  it('has a description', function() {
    var node = TestUtils.renderIntoDocument(React.createElement(FormSelectInput, this.props));
    var option = findByTag(node, 'p').getDOMNode();
    expect(option).to.exist.and.to.have.textContent('my description');
  });

  it('renders the options passed to it', function() {
    var props = _.extend({
      options: [
        { key: '1', label: 'one', value: 'uno' },
        { key: '2', label: 'two', value: 'dos' }
      ]
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormSelectInput, props));
    var options = findAllByTag(node, 'option');
    expect(options).to.have.length(2);
    var option1 = options[0].getDOMNode();
    expect(option1).to.have.textContent('one');
    expect(option1.value).to.eq('uno');
  });

  it('can have an initial value', function() {
    var props = _.extend({
      initialValue: 'dos',
      options: [
        { key: '1', label: 'one', value: 'uno' },
        { key: '2', label: 'two', value: 'dos' }
      ]
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormSelectInput, props));
    var options = findAllByTag(node, 'option');
    var option2 = options[1].getDOMNode();
    expect(option2).to.have.textContent('two');
    expect(option2.value).to.eq('dos');
    expect(option2.selected).to.eq(true);
  });

});
