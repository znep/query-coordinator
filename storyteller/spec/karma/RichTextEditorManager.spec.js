import $ from 'jquery';
import { assert } from 'chai';

import { $transient } from './TransientElement';
import RichTextEditor from '../../app/assets/javascripts/editor/RichTextEditor';
import RichTextEditorToolbar from '../../app/assets/javascripts/editor/RichTextEditorToolbar';
import RichTextEditorManager from '../../app/assets/javascripts/editor/RichTextEditorManager';

describe('RichTextEditorManager', function() {

  var validElement;
  var validFormats = [];
  var validToolbar;

  beforeEach(function() {
    validElement = $('<div id="rich-text-editor-toolbar"></div>');
    validToolbar = Object.create(RichTextEditorToolbar.prototype);
    $transient.append(validElement);
  });

  describe('constructor', function() {
    describe('when called with an invalid toolbar', function() {
      it('throws an error', function() {
        assert.throw(function() {
          new RichTextEditorManager( //eslint-disable-line no-new
            null,
            validFormats
          );
        });
      });
    });

    describe('when called with a valid toolbarElement', function() {
      it('returns an instance of RichTextEditorManager', function() {
        var manager = new RichTextEditorManager(
          validToolbar,
          validFormats
        );

        assert.instanceOf(manager, RichTextEditorManager, 'returns an instance of RichTextEditorManager');
      });
    });

    describe('when called with an invalid formats', function() {
      it('throws an error', function() {
        assert.throw(function() {
          new RichTextEditorManager( //eslint-disable-line no-new
            validToolbar,
            null
          );
        });
      });
    });

    describe('when called with a valid formats', function() {
      it('returns an instance of RichTextEditorManager', function() {
        var manager = new RichTextEditorManager(
          validToolbar,
          validFormats
        );

        assert.instanceOf(manager, RichTextEditorManager, 'returns an instance of RichTextEditorManager');
      });
    });
  });

  describe('instance variables', function() {
    it('should should not expose `_editors` directly', function() {
      var manager = new RichTextEditorManager(
        validToolbar,
        validFormats
      );

      assert.isUndefined(manager._editors, '`_editors` is undefined on text editor manager');
    });
  });

  describe('.getEditor()', function() {
    var manager;

    beforeEach(function() {
      manager = new RichTextEditorManager(
        validToolbar,
        validFormats
      );
    });

    describe('when called with a non-existent editor id', function() {
      it('should return null', function() {
        assert.isNull(manager.getEditor('does not exist'), 'returns null');
      });
    });

    describe('when called with an editor id that exists', function() {
      it('should return an editor instance', function() {
        manager.createEditor(validElement, '1', 'Hello, world!');
        assert.instanceOf(manager.getEditor('1'), RichTextEditor, 'returns an instance of RichTextEditor');
      });
    });
  });

  describe('.getAllEditors()', function() {
    var manager;

    beforeEach(function() {
      manager = new RichTextEditorManager(
        validToolbar,
        validFormats
      );
    });

    describe('when called when no editors have been created', function() {
      it('returns an empty object', function() {
        assert.isObject(manager.getAllEditors());
      });
    });

    describe('when called with one or more editors', function() {
      it('returns an object with editor IDs as keys and instances as values', function() {
        var editors;
        var keys;

        manager.createEditor(validElement, '1', 'Hello, Mars!');
        manager.createEditor(validElement, '2', 'Hello, World!');

        editors = manager.getAllEditors();

        assert.isObject(editors);

        keys = Object.keys(editors);
        assert.lengthOf(keys, 2);
        assert.deepEqual(keys, ['1', '2']);
      });
    });
  });
});
