describe('ConfigureBoundaryForm', function() {
  var TestUtils = React.addons.TestUtils;
  var findByClass = TestUtils.findRenderedDOMComponentWithClass;
  var findByTag = TestUtils.findRenderedDOMComponentWithTag;
  var georegionComponents = blist.namespace.fetch('blist.georegions.components');
  var ConfigureBoundaryForm = georegionComponents.ConfigureBoundaryForm;

  beforeEach(function() {
    this.target = $('<div/>').appendTo(document.body).get(0);
    this.shallowRenderer = TestUtils.createRenderer();
    this.props = {
      authenticityToken: 'authy',
      id: 12,
      onClose: sinon.stub(),
      onSave: sinon.stub(),
      fetchInitialState: function(complete, success) {
        complete();
        success();
      },
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

  it('saves on submit', function() {
    var saveStub = sinon.stub();
    var node = this.renderIntoDocument({
      onSave: saveStub,
      initialState: {
        name: 'name',
        geometryLabel: 'geometryLabel'
      }
    });

    var form = findByTag(node, 'form');
    TestUtils.Simulate.submit(form);
    expect(saveStub).to.have.been.calledOnce;
  });

});
