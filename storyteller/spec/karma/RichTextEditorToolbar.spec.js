import $ from 'jquery';
import { assert } from 'chai';
import RichTextEditorToolbar from '../../app/assets/javascripts/editor/RichTextEditorToolbar.js';

describe('RichTextEditorToolbar', function() {
  describe('instantiation', function() {
    describe('should throw when', function() {
      it('should throw when providing an element that is not a jQuery object', function() {
        assert.throws(function() {
          new RichTextEditorToolbar({}); //eslint-disable-line no-new
        });
      });

      it('should throw when providing an empty jQuery object', function() {
        assert.throws(function() {
          new RichTextEditorToolbar($('.nothing')); //eslint-disable-line no-new
        });
      });

      it('should throw when providing a jQuery object with multiple DOM elements', function() {
        var $container = $('<div>');

        $container.append($('<div>'));
        $container.append($('<div>'));

        assert.throws(function() {
          new RichTextEditorToolbar($container.find('div')); //eslint-disable-line no-new
        });
      });

      it('should throw when providing a non-Array format', function() {
        assert.throws(function() {
          new RichTextEditorToolbar($('<div>'), null); //eslint-disable-line no-new
        });
      });
    });

    it('should instantiate when passed a jQuery object and format array', function() {
      var toolbar = new RichTextEditorToolbar($('<div>'), []);
      assert.instanceOf(toolbar, RichTextEditorToolbar);
    });
  });

  describe('actions', function() {
    var toolbar;
    var $container;

    beforeEach(function() {
      $container = $('<div>');
      toolbar = new RichTextEditorToolbar($container, []);
    });

    describe('.link()', function() {
      it('should add .active to the container element and remove <select>\'s disabled', function() {
        toolbar.link();
        assert.isTrue($container.hasClass('active'));
        assert.lengthOf($container.find('select[disabled]'), 0);
      });
    });

    describe('.unlink()', function() {
      it('should remove .active to the container element and add <select>\'s disabled', function() {
        toolbar.unlink();
        assert.isFalse($container.hasClass('active'));
        assert.lengthOf($container.find('select[disabled]'), 1);
      });

    });

    describe('.destroy()', function() {
      it('should remove the container element', function() {
        var $parent = $('<div>');
        $parent.append($container);
        toolbar.destroy();
        assert.lengthOf($parent.children(), 0);
      });
    });
  });
});
