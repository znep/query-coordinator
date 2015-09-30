describe('GeoregionAdminTable', function() {
  var TestUtils = React.addons.TestUtils;
  var georegionComponents = blist.namespace.fetch('blist.georegions.components');
  var GeoregionAdminTable = georegionComponents.GeoregionAdminTable;

  beforeEach(function() {
    this.shallowRenderer = TestUtils.createRenderer();
    this.props = {
      authenticityToken: 'token',
      baseUrlPath: '/admin/geo/',
      onEnableSuccess: _.noop
    };
    this.node = TestUtils.renderIntoDocument(React.createElement(GeoregionAdminTable, this.props));
  });

  it('exists', function() {
    expect(GeoregionAdminTable).to.exist;
  });

  it('renders', function() {
    expect(_.isElement(this.node.getDOMNode())).to.eq(true);
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
      this.node = TestUtils.renderIntoDocument(React.createElement(GeoregionAdminTable, this.props));
    });

    it('renders the rows', function() {
      var rows = TestUtils.scryRenderedComponentsWithType(this.node, georegionComponents.GeoregionAdminRow);
      expect(rows).to.have.length(3);
      expect(rows[1]).to.have.deep.property('props.isEnabled', false);
      expect(rows[1]).to.have.deep.property('props.renderActions', true);
      expect(rows[1]).to.have.deep.property('props.action', '/admin/geo/2');
    });

  });

});
