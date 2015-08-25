describe('RichTextEditor', function() {

  var validEditorId = '1';
  var validFormats = [];
  var validPreloadContent = 'Hello, world!';
  var storyteller = window.socrata.storyteller;

  // Squire does not attach itself to the window if it detects that
  // it is inside an iFrame.
  //
  // Because karma runs tests in an iframe, we need to mock a Squire
  // object on the window in order to test the correct instantiation
  // of the wrapper object.
  beforeEach(function() {
    testDom.append($('<div class="text-editor">'));
  });

  describe('constructor', function() {

    describe('when called with an element that is not a jQuery object', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          var editor = new RichTextEditor(
            null,
            validEditorId,
            window.socrata.storyteller.assetFinder,
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
            window.socrata.storyteller.assetFinder,
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
            window.socrata.storyteller.assetFinder,
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
              window.socrata.storyteller.assetFinder,
              validFormats,
              validPreloadContent
            );
          });
        });
      });

      describe('and an editorId that is a number', function() {

        it('creates a new RichTextEditor', function() {

          var jqueryObject = $('.text-editor');
          var editor = new storyteller.RichTextEditor(
            jqueryObject,
            12,
            window.socrata.storyteller.assetFinder,
            validFormats,
            validPreloadContent
          );

          assert.instanceOf(editor, storyteller.RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });

      describe('and an editorId that is a string', function() {

        it('creates a new RichTextEditor', function() {

          var jqueryObject = $('.text-editor');
          var editor = new storyteller.RichTextEditor(
            jqueryObject,
            '12',
            storyteller.assetFinder,
            validFormats,
            validPreloadContent
          );

          assert.instanceOf(editor, storyteller.RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });

      describe('and an assetFinder that is not an instance of AssetFinder', function() {

        it('raises an exception', function() {

          var jqueryObject = $('.text-editor');
          assert.throws(function() {
            var editor = new storyteller.RichTextEditor(
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
          var editor = new storyteller.RichTextEditor(
            jqueryObject,
            '12',
            window.socrata.storyteller.assetFinder,
            validFormats,
            validPreloadContent
          );

          assert.instanceOf(editor, storyteller.RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });

      describe('and a formats that is not an instance of Array', function() {

        it('raises an exception', function() {

          var jqueryObject = $('.text-editor');
          assert.throws(function() {
            var editor = new RichTextEditor(
              jqueryObject,
              '12',
              window.socrata.storyteller.assetFinder,
              false,
              validPreloadContent
            );
          });
        });
      });

      describe('and a formats that is an instance of Array', function() {

        it('creates a new RichTextEditor', function() {

          var jqueryObject = $('.text-editor');
          var editor = new storyteller.RichTextEditor(
            jqueryObject,
            '12',
            window.socrata.storyteller.assetFinder,
            validFormats,
            validPreloadContent
          );

          assert.instanceOf(editor, storyteller.RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });

      describe('and no preloadContent', function() {

        it('creates a new RichTextEditor', function() {

          var jqueryObject = $('.text-editor');
          var editor = new storyteller.RichTextEditor(
            jqueryObject,
            validEditorId,
            window.socrata.storyteller.assetFinder,
            validFormats
          );

          assert.instanceOf(editor, storyteller.RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });

      describe('and a preloadContent that is not a string', function() {

        it('raises an exception', function() {

          var jqueryObject = $('.text-editor');
          assert.throws(function() {
            var editor = new storyteller.RichTextEditor(
              jqueryObject,
              validEditorId,
              window.socrata.storyteller.assetFinder,
              validFormats,
              12
            );
          });
        });
      });

      describe('and a preloadContent that is a string', function() {

        it('creates a new RichTextEditor', function() {

          var jqueryObject = $('.text-editor');
          var editor = new storyteller.RichTextEditor(
            jqueryObject,
            validEditorId,
            storyteller.assetFinder,
            validFormats,
            'Hello, world!'
          );

          assert.instanceOf(editor, storyteller.RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });
    });
  });



  describe('with an existing editor', function() {
    var $textEditor;
    var editor;
    var $documentElement;

    beforeEach(function() {
      $textEditor = $('.text-editor');
      editor = new storyteller.RichTextEditor(
        $textEditor,
        validEditorId,
        window.socrata.storyteller.assetFinder,
        validFormats,
        'Hello, world!'
      );

      $documentElement = $($textEditor.find('iframe')[0].contentDocument.documentElement);
    });

    describe('window class breaks', function() {
      it('should apply the current class break to the iframe documentElement (html node)', function() {
        var currentClassName = storyteller.windowSizeBreakpointStore.getClassBreak();

        assert.isTrue($documentElement.hasClass(currentClassName));
      });
    });

    describe('setTheme', function() {
      it('has the theme-classic class initially', function() {
        assert.isTrue($documentElement.hasClass('theme-classic'));
      });

      it('adds a new theme class when called', function() {
        editor.setTheme('sans');
        assert.isTrue($documentElement.hasClass('theme-sans'));
      });

      it('removes old `theme-*` classes when a new theme is set', function() {
        editor.setTheme('sans');
        editor.setTheme('serif');
        var currentClasses = $documentElement.attr('class');

        assert.lengthOf(currentClasses.match(/theme-/ig), 1);
      });
    });

  });


  describe('.destroy()', function() {

    it('removes the editor element from the container', function() {

      var jqueryObject = $('.text-editor');
      var editor = new storyteller.RichTextEditor(
        jqueryObject,
        validEditorId,
        window.socrata.storyteller.assetFinder,
        validFormats,
        'Hello, world!'
      );

      assert.instanceOf(editor, storyteller.RichTextEditor, 'editor is an instance of RichTextEditor');
      assert.isTrue($('iframe').length > 0, 'an iframe exists');

      editor.destroy();

      assert.isFalse($('iframe').length > 0, 'no iframe exists');
    });
  });
});
