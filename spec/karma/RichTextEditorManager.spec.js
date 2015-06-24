describe('RichTextEditorManager', function() {

  var validAssetFinder;
  var validFormats = [];
  var validToolbarElement;

  beforeEach(function() {
    AssetFinderMocker.mock();
    validAssetFinder = new AssetFinder();
    $('body').append('<div id="rich-text-editor-toolbar"></div>');
    validToolbarElement = $('#rich-text-editor-toolbar');
  });

  afterEach(function() {
    $('#rich-text-editor-toolbar').remove();
    AssetFinderMocker.unmock();
  });

  describe('constructor', function() {

    describe('when called with an invalid assetFinder', function() {

      it('throws an error', function() {

        assert.throw(function() {
          var manager = new RichTextEditorManager(
            null,
            validFormats,
            validToolbarElement
          );
        });
      });
    });

    describe('when called with a valid assetFinder', function() {

      it('returns an instance of RichTextEditorManager', function() {

        var manager = new RichTextEditorManager(
          validAssetFinder,
          validFormats,
          validToolbarElement
        );

        assert.instanceOf(manager, RichTextEditorManager, 'returns an instance of RichTextEditorManager');
      });
    });

    describe('when called with an invalid formats', function() {

      it('throws an error', function() {

        assert.throw(function() {
          var manager = new RichTextEditorManager(
            validAssetFinder,
            null,
            validToolbarElement
          );
        });
      });
    });

    describe('when called with a valid formats', function() {

      it('returns an instance of RichTextEditorManager', function() {

        var manager = new RichTextEditorManager(
          validAssetFinder,
          validFormats,
          validToolbarElement
        );

        assert.instanceOf(manager, RichTextEditorManager, 'returns an instance of RichTextEditorManager');
      });
    });

    describe('when called with an invalid toolbarElement', function() {

      it('throws an error', function() {

        assert.throw(function() {
          var manager = new RichTextEditorManager(
            validAssetFinder,
            validFormats,
            null
          );
        });
      });
    });

    describe('when called with a valid toolbarElement', function() {

      it('returns an instance of RichTextEditorManager', function() {

        var manager = new RichTextEditorManager(
          validAssetFinder,
          validFormats,
          validToolbarElement
        );

        assert.instanceOf(manager, RichTextEditorManager, 'returns an instance of RichTextEditorManager');
      });
    });
  });

  describe('instance variables', function() {

    it('should should not expose `_editors` directly', function() {

      var manager = new RichTextEditorManager(
        validAssetFinder,
        validFormats,
        validToolbarElement
      );

      assert.isUndefined(manager._editors, '`_editors` is undefined on text editor manager');
    });
  });

  describe('.getEditor()', function() {

    var manager;

    beforeEach(function() {
      manager = new RichTextEditorManager(
        validAssetFinder,
        validFormats,
        validToolbarElement
      );
    });

    describe('when called with a non-existent editor id', function() {
      it('should return null', function() {
        assert.isNull(manager.getEditor('does not exist'), 'returns null');
      });
    });

    describe('when called with an editor id that exists', function() {
      it('should return an editor instance', function() {
        manager.createEditor('1', 'Hello, world!');
        assert.instanceOf(manager.getEditor('1'), RichTextEditor, 'returns an instance of RichTextEditor');
      });
    });
  });
});
