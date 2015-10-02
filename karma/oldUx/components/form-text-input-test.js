describe('FormTextInput', function() {

  var components = blist.namespace.fetch('blist.components');
  var FormTextInput = components.FormTextInput;
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

  it('renders', function() {
    this.shallowRenderer.render(React.createElement(FormTextInput, this.props));
    var result = this.shallowRenderer.getRenderOutput();
    expect(result.type).to.eq('div');
  });

  it('has a label', function() {
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, this.props));
    var label = findAllByTag(node, 'label')[0].getDOMNode();
    expect(label).to.exist.and.to.have.textContent('my input');
  });

  it('has an input', function() {
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, this.props));
    var input = findByTag(node, 'input').getDOMNode();
    expect(input).to.exist;
  });

  it('shows validation errors', function() {
    var props = _.extend({
      required: true,
      validationError: 'error message'
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, props));
    TestUtils.Simulate.change(findByTag(node, 'input'));
    var label = findAllByTag(node, 'label')[1].getDOMNode();
    expect(label).to.exist.and.to.have.textContent('error message');
  });

  it('has a description', function() {
    var props = _.extend({
      description: 'my description'
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, props));
    var option = findByTag(node, 'p').getDOMNode();
    expect(option).to.exist.and.to.have.textContent('my description');
  });

  it('can have an initial value', function() {
    var props = _.extend({
      initialValue: 'my value'
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, props));
    var input = findByTag(node, 'input').getDOMNode();
    expect(input.value).to.eq('my value');
  });

  it('can be required', function() {
    var props = _.extend({
      required: true
    }, this.props);
    var node = TestUtils.renderIntoDocument(React.createElement(FormTextInput, props));
    var label = findAllByTag(node, 'label')[0].getDOMNode();
    expect(label).to.have.className('required');
    var input = findByTag(node, 'input').getDOMNode();
    expect(input).to.have.className('required');
  });

});
