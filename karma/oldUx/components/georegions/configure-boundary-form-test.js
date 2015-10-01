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

  it('requests the boundary on mount', function() {
    TestUtils.renderIntoDocument(React.createElement(ConfigureBoundaryForm, this.props));
    expect($.ajax).to.have.been.calledWithMatch({
      dataType: 'json',
      type: 'get',
      url: '/admin/geo/12'
    });
  });

  it('shows the spinner when loading', function() {
    var node = TestUtils.renderIntoDocument(React.createElement(ConfigureBoundaryForm, this.props));
    var spinner = findByClass(node, 'georegion-spinner').getDOMNode();
    expect(spinner.style.display).to.eq('block');
  });

  it('hides the spinner when not loading', function() {
    var node = TestUtils.renderIntoDocument(React.createElement(ConfigureBoundaryForm, this.props));
    var spinner = findByClass(node, 'georegion-spinner').getDOMNode();
    $.ajax.firstCall.args[0].complete();
    expect(spinner.style.display).to.eq('none');
  });

  it('saves on submit', function() {
    var node = TestUtils.renderIntoDocument(React.createElement(ConfigureBoundaryForm, this.props));
    $.ajax.firstCall.args[0].complete();
    $.ajax.firstCall.args[0].success({
      'success': true,
      'message': {
        'id': 10,
        'enabledFlag': false,
        'name': 'asdsadsa',
        'featurePk': '_feature_id',
        'geometryLabel': 'name',
        'geometryLabelColumns': [{
          'id': 2029,
          'name': '_feature_id',
          'fieldName': '_feature_id'
        }, {
          'id': 2030,
          'name': '_feature_id_string',
          'fieldName': '_feature_id_string'
        }, {
          'id': 2032,
          'name': 'name',
          'fieldName': 'name'
        }, {
          'id': 2033,
          'name': 'region',
          'fieldName': 'region'
        }, {
          'id': 2034,
          'name': 'iso',
          'fieldName': 'iso'
        }, {
          'id': 2035,
          'name': 'amin0',
          'fieldName': 'amin0'
        }]
      }
    });

    var form = findByTag(node, 'form').getDOMNode();
    TestUtils.Simulate.submit(form);
    var request = $.ajax.secondCall;
    expect(request.args[0]).to.include({
      contentType: 'application/json',
      data: '{"authenticityToken":"authy","boundary":{"geometryLabel":"name","name":"asdsadsa"}}',
      dataType: 'json',
      type: 'put',
      url: '/admin/geo/12'
    })
  });

});
