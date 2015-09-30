describe('LoadingButton', function() {

  var components = blist.namespace.fetch('blist.components');
  var LoadingButton = components.LoadingButton;
  var TestUtils = React.addons.TestUtils;
  var findByTag = TestUtils.findRenderedDOMComponentWithTag;
  var findByClass = TestUtils.findRenderedDOMComponentWithClass;

  beforeEach(function() {
    this.target = $('<div/>').appendTo(document.body).get(0);
    this.shallowRenderer = TestUtils.createRenderer();
    this.props = {
    };
  });

  afterEach(function() {
    $(this.target).remove();
  });

  it('exists', function() {
    expect(LoadingButton).to.exist;
  });

  it('renders', function() {
    this.shallowRenderer.render(React.createElement(LoadingButton, this.props));
    var result = this.shallowRenderer.getRenderOutput();
    expect(result.type).to.eq('button');
  });

  describe('when isLoading=true', function() {

    beforeEach(function() {
      this.props['isLoading'] = true;
      this.node = TestUtils.renderIntoDocument(React.createElement(LoadingButton, this.props));
    });

    it('shows the spinner', function() {
      var spinner = findByClass(this.node, 'loading').getDOMNode();
      var spinnerStyle = spinner.style;
      expect(spinnerStyle.display).to.eq('block');
    });

  });

  describe('disabled', function() {
    beforeEach(function() {
      this.props['disabled'] = true;
      this.node = TestUtils.renderIntoDocument(React.createElement(LoadingButton, this.props));
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
