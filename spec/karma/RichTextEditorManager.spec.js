describe('RichTextEditorManager', function() {

  var validElement;
  var validFormats = [];
  var validToolbar;
  var storyteller = window.socrata.storyteller;

  beforeEach(function() {
    validElement = $('<div id="rich-text-editor-toolbar"></div>');
    validToolbar = Object.create(storyteller.RichTextEditorToolbar.prototype);
    testDom.append(validElement);
  });

  describe('constructor', function() {

    describe('when called with an invalid assetFinder', function() {

      it('throws an error', function() {

        assert.throw(function() {
          var manager = new storyteller.RichTextEditorManager(
            null,
            validToolbar,
            validFormats
          );
        });
      });
    });

    describe('when called with a valid assetFinder', function() {

      it('returns an instance of RichTextEditorManager', function() {

        var manager = new storyteller.RichTextEditorManager(
          window.socrata.storyteller.assetFinder,
          validToolbar,
          validFormats
        );

        assert.instanceOf(manager, storyteller.RichTextEditorManager, 'returns an instance of RichTextEditorManager');
      });
    });

    describe('when called with an invalid toolbar', function() {

      it('throws an error', function() {

        assert.throw(function() {
          var manager = new storyteller.RichTextEditorManager(
            window.socrata.storyteller.assetFinder,
            null,
            validFormats
          );
        });
      });
    });

    describe('when called with a valid toolbarElement', function() {

      it('returns an instance of RichTextEditorManager', function() {

        var manager = new storyteller.RichTextEditorManager(
          window.socrata.storyteller.assetFinder,
          validToolbar,
          validFormats
        );

        assert.instanceOf(manager, storyteller.RichTextEditorManager, 'returns an instance of RichTextEditorManager');
      });
    });

    describe('when called with an invalid formats', function() {

      it('throws an error', function() {

        assert.throw(function() {
          var manager = new storyteller.RichTextEditorManager(
            window.socrata.storyteller.assetFinder,
            validToolbar,
            null
          );
        });
      });
    });

    describe('when called with a valid formats', function() {

      it('returns an instance of RichTextEditorManager', function() {

        var manager = new storyteller.RichTextEditorManager(
          window.socrata.storyteller.assetFinder,
          validToolbar,
          validFormats
        );

        assert.instanceOf(manager, storyteller.RichTextEditorManager, 'returns an instance of RichTextEditorManager');
      });
    });
  });

  describe('instance variables', function() {

    it('should should not expose `_editors` directly', function() {

      var manager = new storyteller.RichTextEditorManager(
        window.socrata.storyteller.assetFinder,
        validToolbar,
        validFormats
      );

      assert.isUndefined(manager._editors, '`_editors` is undefined on text editor manager');
    });
  });

  describe('.getEditor()', function() {

    var manager;

    beforeEach(function() {
      manager = new storyteller.RichTextEditorManager(
        window.socrata.storyteller.assetFinder,
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
        assert.instanceOf(manager.getEditor('1'), storyteller.RichTextEditor, 'returns an instance of RichTextEditor');
      });
    });
  });
});
