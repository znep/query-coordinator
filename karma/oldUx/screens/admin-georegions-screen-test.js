describe('admin-georegions-screen', function() {
  var components = blist.namespace.fetch('blist.components');
  var georegionComponents = blist.namespace.fetch('blist.georegions.components');
  var TestUtils = React.addons.TestUtils;
  var findByClass = TestUtils.findRenderedDOMComponentWithClass;
  var node;

  beforeEach(function() {
    this.target = $('<div/>').appendTo(document.body).get(0);
    this.shallowRenderer = TestUtils.createRenderer();
    var translationStub = sinon.stub(window, 't');
    translationStub.withArgs('enabled_yes').returns('Yes');
    translationStub.withArgs('enabled_no').returns('No');
    translationStub.withArgs('disable').returns('Disable');
    translationStub.withArgs('enable').returns('Enable');
    this.translationStub = translationStub;
  });

  afterEach(function() {
    $(this.target).remove();
    this.translationStub.restore();
  });

  describe('EnabledWidget', function() {
    var EnabledWidget = georegionComponents.EnabledWidget;

    beforeEach(function() {
      this.props = {
        action: '/foo',
        authenticityToken: 'abcd'
      };
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

      it('says "Yes" when enabled', function() {
        expect(this.translationStub).to.have.been.calledWith('enabled_yes');
        expect(findByClass(this.node, 'enabled-widget-label').getDOMNode().textContent).to.eq('Yes');
      });

    });

    describe('when disabled', function() {
      beforeEach(function() {
        this.props['isEnabled'] = false;
        this.node = TestUtils.renderIntoDocument(React.createElement(EnabledWidget, this.props));
      });

      it('says "No" when disabled', function() {
        expect(this.translationStub).to.have.been.calledWith('enabled_no');
        expect(findByClass(this.node, 'enabled-widget-label').getDOMNode().textContent).to.eq('No');
      });

    });

  });

  describe('GeoregionAdminTable', function() {
    var GeoregionAdminTable = georegionComponents.GeoregionAdminTable;

    beforeEach(function() {
      this.props = {
        authenticityToken: 'token',
        baseUrlPath: '/admin/geo/'
      };
      node = TestUtils.renderIntoDocument(React.createElement(GeoregionAdminTable, this.props));
    });

    it('exists', function() {
      expect(GeoregionAdminTable).to.exist;
    });

    it('renders', function() {
      expect(_.isElement(node.getDOMNode())).to.eq(true);
    });

    it('renders', function() {
      this.shallowRenderer.render(React.createElement(GeoregionAdminTable, this.props));
      var result = this.shallowRenderer.getRenderOutput();
      expect(result.type).to.eq('table');
    });

    describe('with row data', function() {
      beforeEach(function() {
        this.props['rows'] = [
          { enabledFlag: true, id: 1, name: 'Item 1' },
          { enabledFlag: false, id: 2, name: 'Item 2' },
          { enabledFlag: true, id: 3, name: 'Item 3' }
        ];
        node = TestUtils.renderIntoDocument(React.createElement(GeoregionAdminTable, this.props));
      });

      it('renders the rows', function() {
        var rows = TestUtils.scryRenderedComponentsWithType(node, georegionComponents.GeoregionAdminRow);
        expect(rows).to.have.length(3);
        expect(rows[1]).to.have.deep.property('props.isEnabled', false);
        expect(rows[1]).to.have.deep.property('props.renderActions', true);
        expect(rows[1]).to.have.deep.property('props.action', '/admin/geo/2');
      });

    });

  });

  describe('commonNS.georegionsSelected', function() {
    var renderPageStub;

    beforeEach(function() {
      $.fn.jqmHide = sinon.stub();
      renderPageStub = sinon.stub(blist.namespace.fetch('blist.georegions'), 'renderPage');
    });

    afterEach(function() {
      renderPageStub.restore();
    });

    var georegionsSelected = blist.namespace.fetch('blist.common.georegionSelected');

    it('exists', function() {
      expect(_.isFunction(georegionsSelected)).to.eq(true);
    });

    it('renders the page', function() {
      georegionsSelected();
      expect(renderPageStub).to.have.been.calledOnce;
    });

    it('adds an item to georegions', function() {
      var stubItem = {};
      georegionsSelected(stubItem);
      expect(blist.namespace.fetch('blist.georegions').georegions).to.include(stubItem);
    });
  });

});
