describe('FormButton', function() {

  var components = blist.namespace.fetch('blist.components');
  var FormButton = components.FormButton;
  var TestUtils = React.addons.TestUtils;
  var findByTag = TestUtils.findRenderedDOMComponentWithTag;

  beforeEach(function() {
    this.target = $('<div/>').appendTo(document.body).get(0);
    this.shallowRenderer = TestUtils.createRenderer();
    this.onSubmitStub = sinon.stub();
    this.props = {
      action: '/foo',
      authenticityToken: 'abcd',
      method: 'put',
      onSubmit: this.onSubmitStub,
      value: 'Click'
    };
  });

  afterEach(function() {
    $(this.target).remove();
  });


  it('exists', function() {
    expect(FormButton).to.exist;
  });

  it('renders', function() {
    this.shallowRenderer.render(React.createElement(FormButton, this.props));
    var result = this.shallowRenderer.getRenderOutput();
    expect(result.type).to.eq('form');
  });

  describe('rendered', function() {
    beforeEach(function() {
      this.node = TestUtils.renderIntoDocument(React.createElement(FormButton, this.props));
    });

    it('makes an ajax call on submit', function() {
      sinon.stub($, 'ajax').yieldsTo('success', {
        success: true,
        message: 'message'
      });
      TestUtils.Simulate.submit(findByTag(this.node, 'form'));
      expect($.ajax).to.have.been.calledOnce;
      expect(this.onSubmitStub).to.have.been.calledOnce;
      $.ajax.restore();
    });

  });

});
