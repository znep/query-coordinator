describe('admin-georegions-screen', function() {
  var target;
  var components = blist.namespace.fetch('blist.components');
  var georegionComponents = blist.namespace.fetch('blist.georegions.components');
  var TestUtils = React.addons.TestUtils;
  var findByClass = TestUtils.findRenderedDOMComponentWithClass;
  var findByTag = TestUtils.findRenderedDOMComponentWithTag;
  var shallowRenderer;
  var node;
  var translationStub;

  beforeEach(function() {
    target = $('<div/>').appendTo(document.body).get(0);
    shallowRenderer = TestUtils.createRenderer();
    translationStub = sinon.stub(window, 't');
    translationStub.withArgs('enabled_yes').returns('Yes');
    translationStub.withArgs('enabled_no').returns('No');
    translationStub.withArgs('disable').returns('Disable');
    translationStub.withArgs('enable').returns('Enable');
  });

  afterEach(function() {
    $(target).remove();
    translationStub.restore();
  });

  describe('FormButton', function() {
    var FormButton = components.FormButton;
    var onSubmitStub;
    var props;
    beforeEach(function() {
      onSubmitStub = sinon.stub();
      props = {
        action: '/foo',
        authenticityToken: 'abcd',
        method: 'put',
        onSubmit: onSubmitStub,
        value: 'Click'
      };
    });

    it('exists', function() {
      expect(FormButton).to.exist;
    });

    it('renders', function() {
      shallowRenderer.render(React.createElement(FormButton, props));
      var result = shallowRenderer.getRenderOutput();
      expect(result.type).to.eq('form');
    });

    describe('rendered', function() {
      beforeEach(function() {
        this.node = TestUtils.renderIntoDocument(React.createElement(FormButton, props));
      });

      it('makes an ajax call on submit', function() {
        sinon.stub($, 'ajax').yieldsTo('success', { success: true, message: 'message' });
        TestUtils.Simulate.submit(findByTag(this.node, 'form'));
        expect($.ajax).to.have.been.calledOnce;
        expect(onSubmitStub).to.have.been.calledOnce;
        $.ajax.restore();
      });

    });

  });

  describe('EnabledWidget', function() {
    var EnabledWidget = georegionComponents.EnabledWidget;
    var props;

    beforeEach(function() {
      props = {
        action: '/foo',
        authenticityToken: 'abcd'
      };
    });

    it('exists', function() {
      expect(EnabledWidget).to.exist;
    });

    it('renders', function() {
      props['isEnabled'] = true;
      shallowRenderer.render(React.createElement(EnabledWidget, props));
      var result = shallowRenderer.getRenderOutput();
      expect(result.type).to.eq('div');
    });

    describe('when enabled', function() {
      beforeEach(function() {
        props['isEnabled'] = true;
        node = TestUtils.renderIntoDocument(React.createElement(EnabledWidget, props));
      });

      it('says "Yes" when enabled', function() {
        expect(translationStub).to.have.been.calledWith('enabled_yes');
        expect(findByClass(node, 'enabled-widget-label').getDOMNode().textContent).to.eq('Yes');
      });

    });

    describe('when disabled', function() {
      beforeEach(function() {
        props['isEnabled'] = false;
        node = TestUtils.renderIntoDocument(React.createElement(EnabledWidget, props));
      });

      it('says "No" when disabled', function() {
        expect(translationStub).to.have.been.calledWith('enabled_no');
        expect(findByClass(node, 'enabled-widget-label').getDOMNode().textContent).to.eq('No');
      });

    });

  });

  describe('GeoregionAdminTable', function() {
    var GeoregionAdminTable = georegionComponents.GeoregionAdminTable;
    var props;

    beforeEach(function() {
      props = {
        authenticityToken: 'token',
        baseUrlPath: '/admin/geo/'
      };
      node = TestUtils.renderIntoDocument(React.createElement(GeoregionAdminTable, props));
    });

    it('exists', function() {
      expect(GeoregionAdminTable).to.exist;
    });

    it('renders', function() {
      expect(_.isElement(node.getDOMNode())).to.eq(true);
    });

    it('renders', function() {
      shallowRenderer.render(React.createElement(GeoregionAdminTable, props));
      var result = shallowRenderer.getRenderOutput();
      expect(result.type).to.eq('table');
    });

    describe('with row data', function() {
      beforeEach(function() {
        props['rows'] = [
          { enabledFlag: true, id: 1, name: 'Item 1' },
          { enabledFlag: false, id: 2, name: 'Item 2' },
          { enabledFlag: true, id: 3, name: 'Item 3' }
        ];
        node = TestUtils.renderIntoDocument(React.createElement(GeoregionAdminTable, props));
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
