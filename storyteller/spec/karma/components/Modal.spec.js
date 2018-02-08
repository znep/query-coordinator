import $ from 'jquery';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
import 'editor/components/Modal';

describe('Modal jQuery plugin', function() {

  var node;

  beforeEach(function() {
    node = $transient.append('<div>');
  });

  it('should return `this` for chaining', function() {
    assert.equal(node.modal(), node);
  });

  it('should add the .storyteller-modal class', function() {
    node.modal();
    assert.isTrue(node.hasClass('storyteller-modal'));
  });

  it('should start off hidden', function() {
    node.modal();
    assert.isTrue(node.hasClass('hidden'));
  });

  it('should incorporate the title', function() {
    node.modal({
      title: 'foobar'
    });
    assert.include(node.text(), 'foobar');
  });

  it('should add modal-dialog-wide iff `wide` is set', function() {
    node.modal();
    assert.lengthOf(node.find('.modal-dialog-wide'), 0);

    node.modal({ wide: true });
    assert.lengthOf(node.find('.modal-dialog-wide'), 1);

    node.modal({ wide: false });
    assert.lengthOf(node.find('.modal-dialog-wide'), 0);
  });

  it('should incorporate the contents', function() {
    var content = $('<div>', { 'class': 'foo' }).text('foobar');
    node.modal({
      content: content
    });

    assert.include(node.find('.foo').text(), 'foobar');
  });

  describe('after a second call to modal()', function() {
    beforeEach(function() {
      node.modal({
        title: 'old title',
        content: 'old content'
      });
      node.modal({
        title: 'new title',
        content: 'new content'
      });
    });

    it('should incorporate the new title', function() {
      assert.include(node.text(), 'new title');
    });

    it('should incorporate the new contents', function() {
      assert.include(node.text(), 'new content');
    });
  });

  describe('after modal-open event', function() {
    beforeEach(function() {
      node.modal({
        title: 'test title',
        content: $('<div>')
      });
      node.trigger('modal-open');
    });

    it('should be visible', function() {
      assert.isFalse(node.hasClass('hidden'));
    });

    it('should hide overflow', function() {
      assert.isTrue($('html').hasClass('modal-open'));
    });
  });

  describe('when closing the modal', function() {
    beforeEach(function() {
      node.modal({
        title: 'test title',
        content: $('<div>')
      });
      node.trigger('modal-open');
    });

    it('should emit modal-dismissed on click outside modal-dialog', function(done) {
      node.on('modal-dismissed', function() { done(); });
      node.find('.modal-overlay').click();
    });

    it('should emit modal-dismissed on X click', function(done) {
      node.on('modal-dismissed', function() { done(); });
      node.find('.modal-close-btn').click();
    });

    it('should emit modal-dismissed on ESC', function(done) {
      node.on('modal-dismissed', function() { done(); });
      $(document).triggerHandler($.Event('keyup', { keyCode: 27 })); //eslint-disable-line new-cap
    });

    it('should become invisible', function() {
      node.trigger('modal-close');
      assert.isTrue(node.hasClass('hidden'));
    });

    it('should set overflow to auto', function() {
      node.trigger('modal-close');
      assert.isFalse($('html').hasClass('modal-open'));
    });
  });

});
