import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';

import SquireMocker from './SquireMocker';
import { $transient } from './TransientElement';
import { dispatcher } from '../../app/assets/javascripts/editor/Dispatcher';
import { windowSizeBreakpointStore } from '../../app/assets/javascripts/editor/stores/WindowSizeBreakpointStore';
import RichTextEditor, {__RewireAPI__ as RichTextEditorAPI} from '../../app/assets/javascripts/editor/RichTextEditor';

describe('RichTextEditor', function() {

  var validEditorId = '1';
  var validFormats = [];
  var validPreloadContent = 'Hello, world!';

  // Squire does not attach itself to the window if it detects that
  // it is inside an iFrame.
  //
  // Because karma runs tests in an iframe, we need to mock a Squire
  // object on the window in order to test the correct instantiation
  // of the wrapper object.
  beforeEach(function() {
    $transient.append($('<div class="text-editor">'));
    RichTextEditorAPI.__Rewire__('Squire', SquireMocker);
  });

  afterEach(function() {
    RichTextEditorAPI.__ResetDependency__('Squire');
  });

  describe('constructor', function() {
    it('exists', function() {
      assert.isDefined(RichTextEditor);
    });

    describe('when called with an element that is not a jQuery object', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          new RichTextEditor( //eslint-disable-line no-new
            null,
            validEditorId,
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
          new RichTextEditor( //eslint-disable-line no-new
            jqueryObject,
            validEditorId,
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
          new RichTextEditor( //eslint-disable-line no-new
            jqueryObject,
            validEditorId,
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
            new RichTextEditor( //eslint-disable-line no-new
              jqueryObject,
              false,
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
            new RichTextEditor( //eslint-disable-line no-new
              jqueryObject,
              '12',
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
            validFormats
          );

          assert.instanceOf(editor, RichTextEditor, 'editor is an instance of RichTextEditor');
        });
      });

      describe('and a preloadContent that is not a string', function() {

        it('raises an exception', function() {

          var jqueryObject = $('.text-editor');
          assert.throws(function() {
            new RichTextEditor( //eslint-disable-line no-new
              jqueryObject,
              validEditorId,
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
            validFormats,
            'Hello, world!'
          );

          assert.instanceOf(editor, RichTextEditor, 'editor is an instance of RichTextEditor');
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
      editor = new RichTextEditor(
        $textEditor,
        validEditorId,
        validFormats,
        'Hello, world!'
      );

      $documentElement = $($textEditor.find('iframe')[0].contentDocument.documentElement);
    });

    describe('squire instance', function() {
      it('should return the squire instance attached to this RichTextEditor', function() {
        var instance = editor.getSquireInstance();
        assert.instanceOf(instance, SquireMocker);
      });
    });

    describe('window size classes', function() {
      it('should apply the current class break to the iframe documentElement (html node)', function() {
        var currentClassName = windowSizeBreakpointStore.getWindowSizeClass();

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

    describe('applyThemeFont', function() {
      var googleFontCode = '<link href="https://fonts.googleapis.com/css?family=Quicksand" rel="stylesheet" type="text/css">';

      it('adds unique theme font when called', function() {
        editor.applyThemeFont(googleFontCode);
        editor.applyThemeFont(googleFontCode);

        assert.lengthOf($documentElement.find('link[href="https://fonts.googleapis.com/css?family=Quicksand"]'), 1);
      });
    });

    describe('addContentClass', function() {
      it('adds a new body class when called', function() {
        editor.addContentClass('the-content-class');
        assert.isTrue($documentElement.find('body').hasClass('the-content-class'));
      });
    });

    describe('contentDiffersFrom', function() {
      it('returns false for identical content', function() {
        editor.setContent('foobar');
        assert.isFalse(editor.contentDiffersFrom('foobar'));
      });
      it('returns false for content that differs only in how special characters are represented', function() {
        editor.setContent('foobar&nbsp;baz');
        assert.isFalse(editor.contentDiffersFrom('foobar\xa0baz'));
        assert.isFalse(editor.contentDiffersFrom('foobar&nbsp;baz'));
        editor.setContent('foobar\xa0baz');
        assert.isFalse(editor.contentDiffersFrom('foobar\xa0baz'));
        assert.isFalse(editor.contentDiffersFrom('foobar&nbsp;baz'));
      });
      it('returns true for content differing in letter content', function() {
        editor.setContent('foobar');
        assert.isTrue(editor.contentDiffersFrom('baz'));
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
        editor.getSquireInstance().hasFormat = function(formatName) {
          if (formatName === 'a') {
            return hasFormatA;
          } else {
            throw new Error('unexpected hasFormat call');
          }
        };
      });

      describe('when a user changes path (focus position)', function() {
        describe('to a link (anchor tag)', function() {
          beforeEach(function() { hasFormatA = true; });
          it('should dispatch LINK_TIP_OPEN', function(done) {
            dispatcher.register(function(payload) {
              if (payload.action === 'LINK_TIP_OPEN') {
                assert.deepEqual(
                  payload,
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

            var squire = editor.getSquireInstance();
            // The getSelection stub needs a little more
            // functionality.
            squire.getSelection = _.wrap(
              squire.getSelection,
              function(func, args) {
                var returnValue = func(args);
                returnValue.startContainer = {
                  textContent: 'some text',
                  href: 'an href',
                  getAttribute: _.constant('attribute value'),
                  getBoundingClientRect: _.constant({ foo: 'bar' }),
                  nodeName: 'A',
                  nodeType: 1
                };
                return returnValue;
              });

            setTimeout(function() {
              squire.__invokeEvent__('pathChange');
            }, 1);
          });
        });
        describe('to anything other than a link', function() {
          beforeEach(function() { hasFormatA = false; });
          it('should dispatch LINK_TIP_CLOSE', function(done) {
            dispatcher.register(function(payload) {
              if (payload.action === 'LINK_TIP_CLOSE') {
                done();
              }
            });
            setTimeout(function() {
              editor.getSquireInstance().__invokeEvent__('pathChange');
            });
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
      editor = new RichTextEditor(
        $textEditor,
        validEditorId,
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
      var editor = new RichTextEditor(
        jqueryObject,
        validEditorId,
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
