import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import TestUtils, {
  findRenderedDOMComponentWithTag as findByTag,
  scryRenderedDOMComponentsWithTag as findAllByTag
} from 'react-dom/test-utils';
import { createRenderer } from 'react-test-renderer/shallow';

import FormControls from 'components/form-controls';

describe('FormControls', function() {

  beforeEach(function() {
    this.shallowRenderer = createRenderer();
    sinon.stub($, 't').callsFake(function(key) {
      return 'Translation for: ' + key;
    });
    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(FormControls, props);
    };
    this.renderIntoDocument = function(props) {
      return TestUtils.renderIntoDocument(this.createElement(props));
    };
  });

  afterEach(function() {
    $.t.restore();
  });

  it('exists', function() {
    assert.ok(FormControls);
  });

  it('renders', function() {
    this.shallowRenderer.render(this.createElement());
    var result = this.shallowRenderer.getRenderOutput();
    assert.ok(result);
  });

  describe('cancel button', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument({ onCancel: _.noop });
    });

    it('renders a button', function() {
      var buttons = findAllByTag(this.node, 'button');
      expect(buttons).to.have.length(1);
    });

    it('renders with the appropriate text', function() {
      var button = findByTag(this.node, 'button');
      assert.isTrue(button.classList.contains('button'));
      assert.equal(button.textContent, 'Translation for: core.dialogs.cancel');
    });
  });

  describe('save button', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument({ onSave: _.noop });
    });

    it('renders a button', function() {
      var buttons = findAllByTag(this.node, 'button');
      expect(buttons).to.have.length(1);
    });

    it('renders with the appropriate text', function() {
      var button = findByTag(this.node, 'button');
      assert.isTrue(button.classList.contains('button'));
      assert.isFalse(button.classList.contains('disabled'));
    });

    it('should not be disabled', function() {
      var button = findByTag(this.node, 'button');
      assert.isNotOk(button.attributes.disabled);
    });

    describe('disabled', function() {
      beforeEach(function() {
        var node = this.renderIntoDocument({
          onSave: _.noop,
          saveDisabled: true
        });
        this.button = findByTag(node, 'button');
      });

      it('renders with disabled attribute', function() {
        assert.property(this.button.attributes, 'disabled');
      });

      it('renders with disabled class', function() {
        assert.isTrue(this.button.classList.contains('disabled'));
      });
    });
  });
});
