import React from 'react';
import TestUtils, {
  findRenderedDOMComponentWithClass as findByClass
} from 'react-addons-test-utils';

import EnabledWidget from 'components/georegions/enabled-widget';

describe('EnabledWidget', function() {

  beforeEach(function() {
    this.shallowRenderer = TestUtils.createRenderer();
    this.props = {
      action: '/foo',
      authenticityToken: 'abcd',
      isEnabled: true
    };
    sinon.stub($, 't', function(key) {
      return 'Translation for: ' + key;
    });
    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(EnabledWidget, props);
    };
    this.renderIntoDocument = function(props) {
      return TestUtils.renderIntoDocument(this.createElement(props));
    };
  });

  afterEach(function() {
    $.t.restore();
  });

  it('exists', function() {
    expect(this.createElement()).to.be.a.reactElement;
  });

  it('renders', function() {
    this.shallowRenderer.render(this.createElement());
    var result = this.shallowRenderer.getRenderOutput();
    expect(result).to.be.an.elementOfType('div');
  });

  describe('when enabled', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument();
    });

    it('says "Yes"', function() {
      var actual = findByClass(this.node, 'enabled-widget-label').textContent;
      expect(actual).to.eq('Translation for: screens.admin.georegions.enabled_yes');
    });

  });

  describe('when disabled', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument({ isEnabled: false });
    });

    it('says "No" when disabled', function() {
      var actual = findByClass(this.node, 'enabled-widget-label').textContent;
      expect(actual).to.eq('Translation for: screens.admin.georegions.enabled_no');
    });

  });

});
