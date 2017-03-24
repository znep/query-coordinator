import React from 'react';
import TestUtils, {
  scryRenderedDOMComponentsWithTag as scryByTag,
  findRenderedDOMComponentsWithTag as findByTag,
  findRenderedDOMComponentWithClass as findByClass
} from 'react-addons-test-utils';

import RowStatusWidget from 'components/georegions/row-status-widget';
import Status from 'components/georegions/georegion-status';

describe('RowStatusWidget', function() {

  beforeEach(function() {
    this.shallowRenderer = TestUtils.createRenderer();
    this.props = {
      action: '/foo',
      authenticityToken: 'abcd',
      id: 'foo'
    };
    sinon.stub($, 't', function(key) {
      return 'Translation for: ' + key;
    });
    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(RowStatusWidget, props);
    };
    this.renderIntoDocument = function(props) {
      return TestUtils.renderIntoDocument(this.createElement(props));
    };
  });

  afterEach(function() {
    $.t.restore();
  });

  it('exists', function() {
    expect(this.createElement({status: Status.ENABLED})).to.be.a.reactElement;
  });

  it('renders', function() {
    this.shallowRenderer.render(this.createElement({status: Status.ENABLED}));
    var result = this.shallowRenderer.getRenderOutput();
    expect(result).to.be.an.elementOfType('div');
  });

  describe('when enabled', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument({ status: Status.ENABLED });
    });

    it('says "Ready to use"', function() {
      var actual = findByClass(this.node, 'row-status-widget-label').textContent;
      expect(actual).to.eq('Translation for: screens.admin.georegions.status_enabled');
    });

    it('has a button for disabling', function() {
      var buttons = scryByTag(this.node, 'button');
      expect(buttons).to.have.length(1);
    });

  });

  describe('when disabled', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument({ status: Status.DISABLED });
    });

    it('says "Not enabled"', function() {
      var actual = findByClass(this.node, 'row-status-widget-label').textContent;
      expect(actual).to.eq('Translation for: screens.admin.georegions.status_disabled');
    });

    it('has a button for enabling', function() {
      var buttons = scryByTag(this.node, 'button');
      expect(buttons).to.have.length(1);
    });

  });

  describe('when in progress', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument({ status: Status.PROGRESS });
    });

    it('says "Processing"', function() {
      var actual = findByClass(this.node, 'row-status-widget-label').childNodes[1].textContent;
      expect(actual).to.eq('Translation for: screens.admin.georegions.status_progress');
    });

    it('does not have a button', function() {
      var buttons = scryByTag(this.node, 'button');
      expect(buttons).to.have.length(0);
    });

  });

  describe('when failed', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument({ status: Status.FAILED });
    });

    it('says "Something went wrong..."', function() {
      var actual = findByClass(this.node, 'row-status-widget-label').childNodes[1].textContent;
      expect(actual).to.eq('Translation for: screens.admin.georegions.status_failed');
    });

    it('does not have a button', function() {
      var buttons = scryByTag(this.node, 'button');
      expect(buttons).to.have.length(0);
    });

  });

});
