import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils, {
  scryRenderedDOMComponentsWithClass as findByClass
} from 'react-addons-test-utils';

import RowDefaultWidget from 'components/georegions/row-default-widget';

describe('RowDefaultWidget', function() {
  beforeEach(function() {
    this.shallowRenderer = TestUtils.createRenderer();
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
    expect(this.createElement()).to.be.a.reactElement;
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
