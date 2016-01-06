import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import GeoregionAdminTable from 'components/georegions/georegion-admin-table';
import GeoregionAdminRow from 'components/georegions/georegion-admin-row';

describe('GeoregionAdminTable', function() {

  beforeEach(function() {
    this.shallowRenderer = TestUtils.createRenderer();
    this.props = {
      authenticityToken: 'token',
      baseUrlPath: '/admin/geo/',
      onEnableSuccess: _.noop
    };

    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(GeoregionAdminTable, props);
    };
    this.renderIntoDocument = function(props) {
      return TestUtils.renderIntoDocument(this.createElement(props));
    };
    this.node = this.renderIntoDocument();
  });

  it('exists', function() {
    expect(this.createElement()).to.be.a.reactElement;
  });

  it('renders', function() {
    expect(_.isElement(ReactDOM.findDOMNode(this.node))).to.eq(true);
  });

  it('renders as a table', function() {
    this.shallowRenderer.render(this.createElement());
    var result = this.shallowRenderer.getRenderOutput();
    expect(result.type).to.eq('table');
  });

  describe('with row data', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument({
        rows: [
          { enabledFlag: true, id: 1, name: 'Item 1' },
          { enabledFlag: false, id: 2, name: 'Item 2' },
          { enabledFlag: true, id: 3, name: 'Item 3' }
        ]
      });
    });

    it('renders the rows', function() {
      var rows = TestUtils.scryRenderedComponentsWithType(this.node, GeoregionAdminRow);
      expect(rows).to.have.length(3);
      expect(rows[0]).to.have.deep.property('props.isEnabled', true);
      expect(rows[0]).to.have.deep.property('props.renderActions', true);
      expect(rows[0]).to.have.deep.property('props.action', '/admin/geo/1');
      expect(rows[1]).to.have.deep.property('props.isEnabled', false);
      expect(rows[1]).to.have.deep.property('props.renderActions', true);
      expect(rows[1]).to.have.deep.property('props.action', '/admin/geo/2');
      expect(rows[2]).to.have.deep.property('props.isEnabled', true);
      expect(rows[2]).to.have.deep.property('props.renderActions', true);
      expect(rows[2]).to.have.deep.property('props.action', '/admin/geo/3');
    });

  });

});
