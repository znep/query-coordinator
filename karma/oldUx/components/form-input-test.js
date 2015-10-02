describe('FormInput', function() {

  var components = blist.namespace.fetch('blist.components');
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
      return React.createElement(FormInput, props);
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
    var label = findAllByTag(node, 'label')[0].getDOMNode();
    expect(label).to.have.textContent('my input');
  });

  it('shows validation errors', function() {
    var node = this.renderIntoDocument({
      showValidationError: true,
      validationError: 'error message'
    });
    var label = findAllByTag(node, 'label')[1].getDOMNode();
    expect(label).to.have.textContent('error message');
  });

  it('has a description', function() {
    var node = this.renderIntoDocument();
    var option = findByTag(node, 'p').getDOMNode();
    expect(option).to.have.textContent('my description');
  });

  it('can be required', function() {
    var node = this.renderIntoDocument({
      required: true
    });
    var label = findAllByTag(node, 'label')[0].getDOMNode();
    expect(label).to.have.className('required');
  });

});
