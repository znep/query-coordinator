describe('RichTextEditor', function() {

  var validEditorId = '1';
  var validAssetFinder;
  var validFormats = [];
  var validPreloadContent = 'Hello, world!';

  // Squire does not attach itself to the window if it detects that
  // it is inside an iFrame.
  //
  // Because karma runs tests in an iframe, we need to mock a Squire
  // object on the window in order to test the correct instantiation
  // of the wrapper object.
  beforeEach(function() {
    AssetFinderMocker.mock();
    validAssetFinder = new AssetFinder();
    SquireMocker.mock();
    $('body').append($('<div class="text-editor">'));
  });

  afterEach(function() {
    $('.text-editor').remove();
    SquireMocker.unmock();
    AssetFinderMocker.unmock();
  });

  describe('constructor', function() {

    describe('when called with an element that is not a jQuery object', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          var editor = new RichTextEditor(
            null,
            validEditorId,
            validAssetFinder,
            validFormats,
            validPreloadContent
          );
        });
      });
    });

    describe('when called with an element that is a jQuery object that does not match a DOM element', function() {

      it('raises an exception', function() {

        var jqueryObject = $('.does-not-match-any-elements');
        assert.throws(function() {
          var editor = new RichTextEditor(
            jqueryObject,
            validEditorId,
            validAssetFinder,
            validFormats,
            validPreloadContent
          );
        });
      });
    });

    describe('when called with an element that is a jQuery object that matches more than one DOM element', function() {

      beforeEach(function() {
        $('body').append([
          $('<div class="text-editor">'),
          $('<div class="text-editor">')
        ]);
      });

      afterEach(function() {
        $('.text-editor').remove();
      });

      it('raises an exception', function() {

        var jqueryObject = $('.text-editor');

        assert.throws(function() {
          var editor = new RichTextEditor(
            jqueryObject,
            validEditorId,
            validAssetFinder,
            validFormats,
            validPreloadContent
          );
        });
      });
    });

    describe('when called with an element that is a jQuery object that matches a DOM element', function() {

      describe('and an editorId that is not a number or a string', function() {

        it('raises an exception', function() {

          var jqueryObject = $('.text-editor');
          assert.throws(function() {
            var editor = new RichTextEditor(
              jqueryObject,
              false,
              validAssetFinder,
              validFormats,
              validPreloadContent
            );
          });
        });
      });

      describe('and an editorId that is a number', function() {

        it('creates a new RichTextEditor', function() {

          var jqueryObject = $('.text-editor');
          var editor = new RichTextEditor(
            jqueryObject,
            12,
            validAssetFinder,
            validFormats,
            validPreloadContent
          );

          assert.instanceOf(editor, RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });

      describe('and an editorId that is a string', function() {

        it('creates a new RichTextEditor', function() {

          var jqueryObject = $('.text-editor');
          var editor = new RichTextEditor(
            jqueryObject,
            '12',
            validAssetFinder,
            validFormats,
            validPreloadContent
          );

          assert.instanceOf(editor, RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });

      describe('and an assetFinder that is not an instance of AssetFinder', function() {

        it('raises an exception', function() {

          var jqueryObject = $('.text-editor');
          assert.throws(function() {
            var editor = new RichTextEditor(
              jqueryObject,
              '12',
              null,
              validFormats,
              validPreloadContent
            );
          });
        });
      });

      describe('and an assetFinder that is an instance of AssetFinder', function() {

        it('creates a new RichTextEditor', function() {

          var jqueryObject = $('.text-editor');
          var editor = new RichTextEditor(
            jqueryObject,
            '12',
            validAssetFinder,
            validFormats,
            validPreloadContent
          );

          assert.instanceOf(editor, RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });

      describe('and a formats that is not an instance of Array', function() {

        it('raises an exception', function() {

          var jqueryObject = $('.text-editor');
          assert.throws(function() {
            var editor = new RichTextEditor(
              jqueryObject,
              '12',
              validAssetFinder,
              false,
              validPreloadContent
            );
          });
        });
      });

      describe('and a formats that is an instance of Array', function() {

        it('creates a new RichTextEditor', function() {

          var jqueryObject = $('.text-editor');
          var editor = new RichTextEditor(
            jqueryObject,
            '12',
            validAssetFinder,
            validFormats,
            validPreloadContent
          );

          assert.instanceOf(editor, RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });

      describe('and no preloadContent', function() {

        it('creates a new RichTextEditor', function() {

          var jqueryObject = $('.text-editor');
          var editor = new RichTextEditor(
            jqueryObject,
            validEditorId,
            validAssetFinder,
            validFormats
          );

          assert.instanceOf(editor, RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });

      describe('and a preloadContent that is not a string', function() {

        it('raises an exception', function() {

          var jqueryObject = $('.text-editor');
          assert.throws(function() {
            var editor = new RichTextEditor(
              jqueryObject,
              validEditorId,
              validAssetFinder,
              validFormats,
              12
            );
          });
        });
      });

      describe('and a preloadContent that is a string', function() {

        it('creates a new RichTextEditor', function() {

          var jqueryObject = $('.text-editor');
          var editor = new RichTextEditor(
            jqueryObject,
            validEditorId,
            validAssetFinder,
            validFormats,
            'Hello, world!'
          );

          assert.instanceOf(editor, RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });
    });
  });

  describe('.destroy()', function() {

    it('removes the editor element from the container', function() {

      var jqueryObject = $('.text-editor');
      var editor = new RichTextEditor(
        jqueryObject,
        validEditorId,
        validAssetFinder,
        validFormats,
        'Hello, world!'
      );

      assert.instanceOf(editor, RichTextEditor, 'editor is an instance of RichTextEditor');
      assert.isTrue($('iframe').length > 0, 'an iframe exists');

      editor.destroy();

      assert.isFalse($('iframe').length > 0, 'no iframe exists');
    });
  });
});
