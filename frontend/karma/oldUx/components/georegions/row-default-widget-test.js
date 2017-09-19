import { expect, assert } from 'chai';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils, {
  scryRenderedDOMComponentsWithClass as findByClass
} from 'react-dom/test-utils';
import { createRenderer } from 'react-test-renderer/shallow';

import RowDefaultWidget from 'components/georegions/row-default-widget';

describe('RowDefaultWidget', function() {
  beforeEach(function() {
    this.shallowRenderer = createRenderer();
    this.props = {
      action: 'abcd',
      allowDefaulting: true,
      authenticityToken: 'abcd',
      defaultLimit: 5,
      defaultStatus: false,
      enabledStatus: 'enabled',
      id: '1234'
    };
    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(RowDefaultWidget, props);
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

  it('renders a disabled checkbox when allowDefaulting is false', function() {
    this.node = this.renderIntoDocument({ allowDefaulting: false });
    var checkboxes = findByClass(this.node, 'disabled');
    expect(checkboxes).to.have.length(1);
  });

  it('renders a checked checkbox when row is set to default', function() {
    this.node = this.renderIntoDocument({ defaultStatus: true });
    var checkboxes = findByClass(this.node, 'unchecked');
    expect(checkboxes).to.have.length(0);
  });

  it('renders an unchecked checkbox when not set to default', function() {
    this.node = this.renderIntoDocument();
    var checkboxes = findByClass(this.node, 'unchecked');
    expect(checkboxes).to.have.length(1);
  });
});
