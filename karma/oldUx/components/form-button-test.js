describe('FormButton', function() {

  var components = blist.namespace.fetch('blist.components');
  var FormButton = components.FormButton;
  var TestUtils = React.addons.TestUtils;
  var findByTag = TestUtils.findRenderedDOMComponentWithTag;

  beforeEach(function() {
    this.target = $('<div/>').appendTo(document.body).get(0);
    this.shallowRenderer = TestUtils.createRenderer();
    this.onSuccessStub = sinon.stub();
    this.props = {
      action: '/foo',
      authenticityToken: 'abcd',
      method: 'put',
      onSuccess: this.onSuccessStub,
      value: 'Click'
    };
    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(FormButton, props);
    };
    this.renderIntoDocument = function(props) {
      return TestUtils.renderIntoDocument(this.createElement(props));
    };
  });

  afterEach(function() {
    $(this.target).remove();
  });

  it('exists', function() {
    expect(this.createElement()).to.be.a.reactElement;
  });

  it('renders', function() {
    this.shallowRenderer.render(this.createElement());
    var result = this.shallowRenderer.getRenderOutput();
    expect(result).to.be.an.elementOfType('form');
  });

  describe('rendered', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument();
      sinon.stub($, 'ajax').yieldsTo('success', {
        success: true,
        message: 'message'
      });
    });

    afterEach(function() {
      $.ajax.restore();
    });

    it('makes an ajax call on submit', function() {
      TestUtils.Simulate.submit(findByTag(this.node, 'form'));
      expect($.ajax).to.have.been.calledOnce;
      expect(this.onSuccessStub).to.have.been.calledOnce;
    });

  });

});
