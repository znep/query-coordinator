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

    describe('squire instance', function() {
      it('should return the squire instance attached to this RichTextEditor', function() {
        var instance = editor.getSquireInstance();
        assert.instanceOf(instance, Squire);
      });
    });

    describe('window size classes', function() {
      it('should apply the current class break to the iframe documentElement (html node)', function() {
        var currentClassName = storyteller.windowSizeBreakpointStore.getWindowSizeClass();

        assert.isTrue($documentElement.hasClass(currentClassName));
      });
    });

    describe('applyThemeClass', function() {
      it('adds a new theme class when called', function() {
        editor.applyThemeClass('sans');
        assert.isTrue($documentElement.hasClass('theme-sans'));
      });

      it('removes old `theme-*` classes when a new theme is set', function() {
        editor.applyThemeClass('sans');
        editor.applyThemeClass('serif');
        var currentClasses = $documentElement.attr('class');

        assert.lengthOf(currentClasses.match(/theme-/ig), 1);
      });
    });

    describe('content height', function() {
      var body;
      beforeEach(function() {
        body = $documentElement.find('body');
        body.empty();
      });

      it('adds to a proper height, taking into account margin collapsing', function() {
        var child = $('<div>', {style: 'height: 200px; margin: 10px 0;'});
        var child2 = $('<div>', {style: 'height: 200px; margin-top: 10px;'});

        body.append([child, child2]);

        // Just to jump start a content height adjustment.
        // This <div> will be ignored.
        editor.setContent('<div></div>');
        assert.equal(editor.getContentHeight(), 420);
      });

      it('adds to a proper height, taking into account body top padding', function() {
        var child = $('<div>', {style: 'height: 200px;'});

        body.css({'padding-top': '10px'});
        body.append(child);

        editor.setContent('<div></div>');
        assert.equal(editor.getContentHeight(), 210);
      });

      it('adds to a proper height, taking into account margin collapsing and body top padding', function() {
        var child = $('<div>', {style: 'height: 200px; margin: 10px 0;'});
        var child2 = $('<div>', {style: 'height: 200px; margin-top: 10px;'});

        body.css({'padding-top': '10px'});
        body.append([child, child2]);

        editor.setContent('<div></div>');
        assert.equal(editor.getContentHeight(), 430);
      });
    });

    describe('Link Tip actions', function() {
      var hasFormatA;

      beforeEach(function() {
        // This function is how RichTextEditor determines if the path is in an
        // anchor.
        Squire.prototype.hasFormat = function(formatName) {
          if (formatName === 'a') {
            return hasFormatA;
          } else {
            throw new Error('unexpected hasFormat call');
          }
        };
      });

      function invokeSquireHandlersFor(eventName) {
        // Look at addEventListener calls on the Squire stub to pull out
        // RichTextEditor's event handlers.

        // Array of arguments to addEventListener. Form:
        // [
        //   [ eventName, handler ],
        //   [ eventName, handler ],
        //   ...
        // ]
        var allAddEventListenerArgs = Squire.stubs.addEventListener.args;

        _.chain(allAddEventListenerArgs).
          filter(function(singleCallArgs) { // Grab only addEventListener calls for eventName.
            return singleCallArgs[0] === eventName;
          }).
          pluck(1). // Grab the actual handler functions.
          invoke(_.call).value(); // Call 'em all (value() is needed to actually realize the chain).
      }

      describe('when a user changes path (focus position)', function() {
        describe('to a link (anchor tag)', function() {
          beforeEach(function() { hasFormatA = true; });
          it('should dispatch LINK_TIP_OPEN', function(done) {
            storyteller.dispatcher.register(function(action) {
              if (action.action === 'LINK_TIP_OPEN') {
                assert.deepEqual(
                  action,
                  {
                    action: 'LINK_TIP_OPEN',
                    editorId: '1',
                    text: 'some text',
                    link: 'an href',
                    openInNewWindow: false,
                    boundingClientRect: { foo: 'bar' }
                  }
                );
                done();
              }
            });

            // The getSelection stub needs a little more
            // functionality.
            Squire.prototype.getSelection = _.wrap(
              Squire.prototype.getSelection,
              function(func, args) {
                var returnValue = func(args);
                returnValue.startContainer = {
                  textContent: 'some text',
                  href: 'an href',
                  getAttribute: _.constant('attribute value'),
                  getBoundingClientRect: _.constant({ foo: 'bar' }),
                  nodeType: 1
                };
                return returnValue;
              });
            invokeSquireHandlersFor('pathChange');
          });
        });
        describe('to anything other than a link', function() {
          beforeEach(function() { hasFormatA = false; });
          it('should dispatch LINK_TIP_CLOSE', function(done) {
            storyteller.dispatcher.register(function(action) {
              if (action.action === 'LINK_TIP_CLOSE') {
                done();
              }
            });
            invokeSquireHandlersFor('pathChange');
          });
        });
      });
    });

  });

  describe('.deselect()', function() {
    var $textEditor;
    var $iframe;
    var editor;

    beforeEach(function() {
     $textEditor = $('.text-editor');
      editor = new storyteller.RichTextEditor(
        $textEditor,
        validEditorId,
        window.socrata.storyteller.assetFinder,
        validFormats,
        'Hello, world!'
      );

      $iframe = $textEditor.find('iframe');
    });

    it('removes any selection that the user or program has made within the iframe', function() {
      var contentDocument = $iframe[0].contentDocument;
      var body = contentDocument.documentElement.querySelector('body');

      body.appendChild($('<span>').text('Hello, World!')[0]);
      contentDocument.documentElement.appendChild(body);

      // Start a selection.
      contentDocument.getSelection().selectAllChildren(body);

      assert.equal(contentDocument.getSelection().toString(), 'Hello, World!');
      editor.deselect();
      assert.equal(contentDocument.getSelection().toString(), '');
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
