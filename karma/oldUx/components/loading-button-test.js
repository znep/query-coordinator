describe('LoadingButton', function() {

  var components = blist.namespace.fetch('blist.components');
  var LoadingButton = components.LoadingButton;
  var TestUtils = React.addons.TestUtils;
  var findByTag = TestUtils.findRenderedDOMComponentWithTag;
  var findByClass = TestUtils.findRenderedDOMComponentWithClass;

  beforeEach(function() {
    this.shallowRenderer = TestUtils.createRenderer();
    this.props = {
    };
    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(LoadingButton, props);
    };
    this.renderIntoDocument = function(props) {
      return TestUtils.renderIntoDocument(this.createElement(props));
    };
  });

  it('exists', function() {
    expect(this.createElement()).to.be.a.reactElement;
  });

  it('renders', function() {
    this.shallowRenderer.render(this.createElement());
    var result = this.shallowRenderer.getRenderOutput();
    expect(result).to.be.an.elementOfType('button');
  });

  describe('when isLoading=true', function() {

    beforeEach(function() {
      this.node = this.renderIntoDocument({ isLoading: true });
    });

    it('shows the spinner', function() {
      var spinner = findByClass(this.node, 'loading').getDOMNode();
      var spinnerStyle = spinner.style;
      expect(spinnerStyle.display).to.eq('block');
    });

  });

  describe('disabled', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument({ disabled: true });
      this.button = findByTag(this.node, 'button').getDOMNode();
    });

    it('has the disabled class', function() {
      expect(this.button).to.have.className('disabled');
    });

    it('prevents the button click event', function() {
      var mockEvent = { preventDefault: sinon.stub() };
      TestUtils.Simulate.click(this.button, mockEvent);
      expect(mockEvent.preventDefault).to.have.callCount(1);
    });

  });

});
