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
  });

  afterEach(function() {
    $(this.target).remove();
    $.t.restore();
    $.ajax.restore();
  });

  it('exists', function() {
    expect(ConfigureBoundaryForm).to.exist;
  });

  it('renders', function() {
    this.shallowRenderer.render(React.createElement(ConfigureBoundaryForm, this.props));
    var result = this.shallowRenderer.getRenderOutput();
    expect(result.type).to.eq('div');
  });

  it('has a title', function() {
    var node = TestUtils.renderIntoDocument(React.createElement(ConfigureBoundaryForm, this.props));
    var title = findByTag(node, 'h2').getDOMNode();
    expect(title).to.exist.and.to.have.textContent('my title');
  });

  it('fetches initial state on mount', function() {
    var fetchStub = sinon.stub();
    var props = _.extend({}, this.props, {
      fetchInitialState: fetchStub
    });
    TestUtils.renderIntoDocument(React.createElement(ConfigureBoundaryForm, props));
    expect(fetchStub).to.have.been.calledOnce;
  });

  it('shows the spinner when loading', function() {
    var props = _.extend({}, this.props, {
      fetchInitialState: _.noop
    });
    var node = TestUtils.renderIntoDocument(React.createElement(ConfigureBoundaryForm, props));
    var spinner = findByClass(node, 'georegion-spinner').getDOMNode();
    expect(spinner.style.display).to.eq('block');
  });

  it('hides the spinner when not loading', function() {
    var fetchStub = sinon.stub();
    var props = _.extend({}, this.props, {
      fetchInitialState: fetchStub
    });
    var node = TestUtils.renderIntoDocument(React.createElement(ConfigureBoundaryForm, props));
    var spinner = findByClass(node, 'georegion-spinner').getDOMNode();
    expect(spinner.style.display).to.eq('block');
    fetchStub.firstCall.args[0]();
    expect(spinner.style.display).to.eq('none');
  });

  it('saves on submit', function() {
    var saveStub = sinon.stub();
    var props = _.extend({}, this.props, {
      onSave: saveStub,
      initialState: {
        name: 'name',
        geometryLabel: 'geometryLabel'
      }
    });
    var node = TestUtils.renderIntoDocument(React.createElement(ConfigureBoundaryForm, props));

    var form = findByTag(node, 'form').getDOMNode();
    TestUtils.Simulate.submit(form);
    expect(saveStub).to.have.been.calledOnce;
  });

});
