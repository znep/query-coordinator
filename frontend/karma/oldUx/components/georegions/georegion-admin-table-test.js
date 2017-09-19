import { expect, assert } from 'chai';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import { createRenderer } from 'react-test-renderer/shallow';

import Status from 'components/georegions/georegion-status';
import GeoregionAdminTable from 'components/georegions/georegion-admin-table';
import GeoregionAdminRow from 'components/georegions/georegion-admin-row';

describe('GeoregionAdminTable', function() {

  beforeEach(function() {
    this.shallowRenderer = createRenderer();
    this.props = {
      authenticityToken: 'token',
      baseUrlPath: '/admin/geo/',
      defaultCount: 0,
      defaultLimit: 5,
      onDefaultSuccess: _.noop,
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
    assert.ok(this.createElement());
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
          { defaultFlag: true, enabledFlag: true, featurePk: 'geo_id', id: 1, name: 'Enabled Curated Region' },
          { defaultFlag: false, enabledFlag: false, featurePk: 'geo_id', id: 2, name: 'Disabled Curated Region' },
          { defaultFlag: false, enabledFlag: false, id: 'cur4t3d-r3g10n-j0b', name: 'In-Progress Curated Region Job' },
          { defaultFlag: false, enabledFlag: false, id: 'f41l3d-cur4t3d-r3g10n-j0b', latest_event: {}, name: 'Failed Curated Region Job' }
        ]
      });
    });

    it('renders the rows', function() {
      var rows = TestUtils.scryRenderedComponentsWithType(this.node, GeoregionAdminRow);
      expect(rows).to.have.length(4);
      expect(rows[0]).to.have.nested.property('props.defaultStatus', true);
      expect(rows[0]).to.have.nested.property('props.status', Status.ENABLED);
      expect(rows[0]).to.have.nested.property('props.action', '/admin/geo/1');
      expect(rows[1]).to.have.nested.property('props.defaultStatus', false);
      expect(rows[1]).to.have.nested.property('props.status', Status.DISABLED);
      expect(rows[1]).to.have.nested.property('props.action', '/admin/geo/2');
      expect(rows[2]).to.have.nested.property('props.defaultStatus', false);
      expect(rows[2]).to.have.nested.property('props.status', Status.PROGRESS);
      expect(rows[2]).to.have.nested.property('props.action', '');
      expect(rows[3]).to.have.nested.property('props.defaultStatus', false);
      expect(rows[3]).to.have.nested.property('props.status', Status.FAILED);
      expect(rows[3]).to.have.nested.property('props.action', '');
    });

  });

});
