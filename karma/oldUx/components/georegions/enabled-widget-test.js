describe('EnabledWidget', function() {
  var TestUtils = React.addons.TestUtils;
  var findByClass = TestUtils.findRenderedDOMComponentWithClass;
  var georegionComponents = blist.namespace.fetch('blist.georegions.components');
  var EnabledWidget = georegionComponents.EnabledWidget;

  beforeEach(function() {
    this.target = $('<div/>').appendTo(document.body).get(0);
    this.shallowRenderer = TestUtils.createRenderer();
    this.props = {
      action: '/foo',
      authenticityToken: 'abcd'
    };
    sinon.stub($, 't', function(key) {
      return 'Translation for: ' + key;
    });
  });

  afterEach(function() {
    $(this.target).remove();
    $.t.restore();
  });

  it('exists', function() {
    expect(EnabledWidget).to.exist;
  });

  it('renders', function() {
    this.props['isEnabled'] = true;
    this.shallowRenderer.render(React.createElement(EnabledWidget, this.props));
    var result = this.shallowRenderer.getRenderOutput();
    expect(result.type).to.eq('div');
  });

  describe('when enabled', function() {
    beforeEach(function() {
      this.props['isEnabled'] = true;
      this.node = TestUtils.renderIntoDocument(React.createElement(EnabledWidget, this.props));
    });

    it('says "Yes"', function() {
      var actual = findByClass(this.node, 'enabled-widget-label').getDOMNode().textContent;
      expect(actual).to.eq('Translation for: screens.admin.georegions.enabled_yes');
    });

  });

  describe('when disabled', function() {
    beforeEach(function() {
      this.props['isEnabled'] = false;
      this.node = TestUtils.renderIntoDocument(React.createElement(EnabledWidget, this.props));
    });

    it('says "No" when disabled', function() {
      var actual = findByClass(this.node, 'enabled-widget-label').getDOMNode().textContent;
      expect(actual).to.eq('Translation for: screens.admin.georegions.enabled_no');
    });

  });

});
