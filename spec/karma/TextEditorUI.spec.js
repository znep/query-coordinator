describe('TextEditorUI class', function() {

  var validEditorId = '1';
  var validPreloadContent = 'Hello, world!';

  describe('constructor', function() {

    describe('when called with an element that is not a jQuery object', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          var editor = new TextEditorUI(null, validEditorId, validPreloadContent);
        });
      });
    });

    describe('when called with an element that is a jQuery object that does not match a DOM element', function() {

      it('raises an exception', function() {

        var jqueryObject = $('.text-editor');

        assert.throws(function() {
          var editor = new TextEditorUI(jqueryObject, validEditorId, validPreloadContent);
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
          var editor = new TextEditorUI(jqueryObject, validEditorId, validPreloadContent);
        });
      });
    });

    describe('when called with an element that is a jQuery object that matches a DOM element', function() {

      // Squire does not attach itself to the window if it detects that
      // it is inside an iFrame.
      //
      // Because karma runs tests in an iframe, we need to mock a Squire
      // object on the window in order to test the correct instantiation
      // of the wrapper object.
      beforeEach(function() {
        SquireMocker.mock();
        $('body').append($('<div class="text-editor">'));
      });

      afterEach(function() {
        $('.text-editor').remove();
        SquireMocker.unmock();
      });

      describe('and an editorId that is not a number or a string', function() {

        it('raises an exception', function() {

          var jqueryObject = $('.text-editor');
          assert.throws(function() {
            var editor = new TextEditorUI(jqueryObject, false, validPreloadContent);
          });
        });
      });

      describe('and an editorId that is a number', function() {

        it('creates a new TextEditorUI', function() {

          var jqueryObject = $('.text-editor');
          var editor = new TextEditorUI(jqueryObject, 12, validPreloadContent);

          assert.instanceOf(editor, TextEditorUI, 'editor is an instance of TextEditorUI');
        });
      });

      describe('and an editorId that is a string', function() {

        it('creates a new TextEditorUI', function() {

          var jqueryObject = $('.text-editor');
          var editor = new TextEditorUI(jqueryObject, '12', validPreloadContent);

          assert.instanceOf(editor, TextEditorUI, 'editor is an instance of TextEditorUI');
        });
      });

      describe('and no preloadContent', function() {

        it('creates a new TextEditorUI', function() {

          var jqueryObject = $('.text-editor');
          var editor = new TextEditorUI(jqueryObject, validEditorId);

          assert.instanceOf(editor, TextEditorUI, 'editor is an instance of TextEditorUI');
        });
      });

      describe('and a preloadContent that is not a string', function() {

        it('raises an exception', function() {

          var jqueryObject = $('.text-editor');
          assert.throws(function() {
            var editor = new TextEditorUI(jqueryObject, validEditorId, 12);
          });
        });
      });

      describe('and a preloadContent that is a string', function() {

        it('creates a new TextEditorUI', function() {

          var jqueryObject = $('.text-editor');
          var editor = new TextEditorUI(jqueryObject, validEditorId, 'Hello, world!');

          assert.instanceOf(editor, TextEditorUI, 'editor is an instance of TextEditorUI');
        });
      });
    });
  });

  describe('.destroy()', function() {

    // Squire does not attach itself to the window if it detects that
    // it is inside an iFrame.
    //
    // Because karma runs tests in an iframe, we need to mock a Squire
    // object on the window in order to test the correct instantiation
    // of the wrapper object.
    beforeEach(function() {
      SquireMocker.mock();
      $('body').append($('<div class="text-editor">'));
    });

    afterEach(function() {
      $('.text-editor').remove();
      SquireMocker.unmock();
    });

    it('removes the editor element from the container', function() {

      var jqueryObject = $('.text-editor');
      var editor = new TextEditorUI(jqueryObject, validEditorId, 'Hello, world!');

      assert.instanceOf(editor, TextEditorUI, 'editor is an instance of TextEditorUI');
      assert.isTrue($('iframe').length > 0, 'an iframe exists');

      editor.destroy();

      assert.isFalse($('iframe').length > 0, 'no iframe exists');
    });
  });
});
