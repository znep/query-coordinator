describe('StoryRenderer', function() {
  'use strict';

  var storyteller = window.socrata.storyteller;
  var storyUid;
  var assetSelectorBlockId;
  var textBlockId;
  var options;
  var validToolbar;
  var validFormats;

  beforeEach(function() {

    testDom.append([
      $('<div>', { 'class': 'insertion-hint hidden' }),
      $('<div>', { 'id': 'rich-text-editor-toolbar' })
    ]);

    validToolbar = Object.create(storyteller.RichTextEditorToolbar.prototype);
    validFormats = [];

    storyteller.richTextEditorManager = new storyteller.RichTextEditorManager(
      storyteller.assetFinder,
      validToolbar,
      validFormats
    );

    storyUid = standardMocks.validStoryUid;
    assetSelectorBlockId = standardMocks.assetSelectorBlockId;
    textBlockId = standardMocks.textBlockId;

    testDom.append(
        $('<div>', { 'class': 'story-container' })
      ).append(
        $('<p>', { 'class': 'message-warning' })
      ).append(
        $('<div>', { 'class': 'insertion-hint' })
      );

    options = {
      storyUid: storyUid,
      storyContainerElement: testDom.find('.story-container'),
      warningMessageElement: testDom.find('.message-warning'),
      insertionHintElement: testDom.find('.insertion-hint'),
      onRenderError: function(error) {
        throw new Error(error); // Fail the test on render error.
      }
    };
  });

  afterEach(function() {
    if (storyteller.storyRenderer) {
      storyteller.storyRenderer.destroy();
    }

    storyteller.RichTextEditorManagerMocker.unmock();
  });

  describe('constructor', function() {

    describe('when passed a configuration object', function() {

      describe('with an onRenderError property that is not a function', function() {

        it('raises an exception', function() {

          options.onRenderError = null;

          assert.throws(function() {
            storyteller.storyRenderer = new storyteller.StoryRenderer(options);
          });
        });
      });

      describe('with no onRenderError property', function() {

        it('creates a new storyteller.StoryRenderer', function() {

          delete options.onRenderError;

          storyteller.storyRenderer = new storyteller.StoryRenderer(options);
          assert.instanceOf(storyteller.storyRenderer, storyteller.StoryRenderer, 'renderer is instance of StoryRenderer');
        });
      });

      describe('with a storyUid property that is not a string', function() {

        it('raises an exception', function() {

          options.storyUid = {};

          assert.throws(function() {
            storyteller.storyRenderer = new storyteller.StoryRenderer(options);
          });
        });
      });

      describe('with a storyContainerElement property that is not a jQuery object', function() {

        it('raises an exception', function() {

          options.storyContainerElement = {};

          assert.throws(function() {
            storyteller.storyRenderer = new storyteller.StoryRenderer(options);
          });
        });
      });

      describe('with a storyContainerElement property that is a jQuery object', function() {

        it('adds a data-story-uid attr to the storyContainerElement', function() {
          var uid = options.storyContainerElement.attr('data-story-uid');
          assert.isUndefined(uid);

          storyteller.storyRenderer = new storyteller.StoryRenderer(options);
          uid = options.storyContainerElement.attr('data-story-uid');
          assert.equal(uid, options.storyUid);
        });
      });

      describe('with an insertionHintElement property that is not a jQuery object', function() {

        it('raises an exception', function() {

          options.insertionHintElement = {};

          assert.throws(function() {
            storyteller.storyRenderer = new storyteller.StoryRenderer(options);
          });
        });
      });

      describe('with an insertionHintElement property that is a jQuery object', function() {

        it('adds a data-story-uid attr to the insertionHintElement', function() {
          var uid = options.insertionHintElement.attr('data-story-uid');
          assert.isUndefined(uid);

          storyteller.storyRenderer = new storyteller.StoryRenderer(options);
          uid = options.insertionHintElement.attr('data-story-uid');
          assert.equal(uid, options.storyUid);
        });
      });

      describe('with with editable set to true but no richTextEditorManager', function() {

        it('raises an exception', function() {

          storyteller.richTextEditorManager = {};

          options.editable = true;

          assert.throws(function() {
            storyteller.storyRenderer = new storyteller.StoryRenderer(options);
          });
        });
      });

      describe('with a custom onRenderError function', function() {

        describe('and an error is thrown', function() {

          it('calls the custom onRenderError function', function(done) {

            options.storyUid = {};
            options.onRenderError = function() {
              assert.isTrue(true);
              done();
            };

            assert.throws(function() {
              storyteller.storyRenderer = new storyteller.StoryRenderer(options);
            });
          });
        });
      });
    });
  });

  describe('when rendering a story', function() {

    afterEach(function() {

      $('.insertion-hint').remove();
      $('#rich-text-editor-toolbar').remove();
    });

    describe('window size class', function() {
      it('should apply the current class break to the story container', function() {

        storyteller.storyRenderer = new storyteller.StoryRenderer(options);

        var currentClassName = storyteller.windowSizeBreakpointStore.getWindowSizeClass();

        assert.isTrue(options.storyContainerElement.hasClass(currentClassName));
      });
    });

    describe('that is empty', function() {
      it('should display an empty story message', function() {
        var storyWithoutBlocks = generateStoryData({
          uid: 'empt-yyyy',
          blocks: []
        });

        storyteller.dispatcher.dispatch({
          action: Actions.STORY_CREATE,
          data: storyWithoutBlocks
        });

        options.storyUid = 'empt-yyyy';
        storyteller.storyRenderer = new storyteller.StoryRenderer(options);

        assert.equal($('.message-warning.message-empty-story').length, 1);
        assert.isAbove($('.message-empty-story').text().length, 1);
        assert.isTrue(I18n.t.calledWith('editor.empty_story_warning'));
      });
    });

    describe('with a story that has blocks', function() {

      it('renders blocks', function() {

        storyteller.storyRenderer = new storyteller.StoryRenderer(options);
        var numberOfBlocks = storyteller.storyStore.getStoryBlockIds(storyUid).length;

        assert.equal($('.block').length, numberOfBlocks);
      });

      it('does not render deleted blocks', function() {

        storyteller.storyRenderer = new storyteller.StoryRenderer(options);
        var numberOfBlocks = storyteller.storyStore.getStoryBlockIds(storyUid).length;

        storyteller.dispatcher.dispatch({
          action: Actions.STORY_DELETE_BLOCK,
          storyUid: storyUid,
          blockId: assetSelectorBlockId
        });

        assert.equal($('.block').length, numberOfBlocks - 1);
      });

      it('does not render the empty story warning', function() {

        storyteller.storyRenderer = new storyteller.StoryRenderer(options);

        assert.equal($('.message-empty-story').length, 0);
      });

      describe('that cause a mid-render rerender', function() {
        it('completes the current render before starting a new render', function() {
          var rendering = false;

          var imageRenderStub = sinon.stub($.fn, 'componentImage', function() {
            assert.isFalse(rendering, 'reentrant call to renderer'); // Shouldn't re-enter.
            rendering = true;

            // Cause a rerender the first render.
            if (imageRenderStub.calledOnce) {
              this[0].dispatchEvent(
                new storyteller.CustomEvent(
                  'component::height-change',
                  { detail: {}, bubbles: true }
                )
              );
            }
            rendering = false;
          });

          storyteller.storyRenderer = new storyteller.StoryRenderer(options);

          sinon.assert.calledTwice(imageRenderStub);

        });
      });

    });

    describe('with a story that has blocks including a media component', function() {

      it('renders blocks', function() {

        var storyWithMedia = generateStoryData({
          uid: 'with-imge',
          blocks: [
            generateBlockData({
              components: [
                { type: 'assetSelector' }
              ]
            })
          ]
        });

        storyteller.dispatcher.dispatch({
          action: Actions.STORY_CREATE,
          data: storyWithMedia
        });

        options.storyUid = 'with-imge';
        storyteller.storyRenderer = new storyteller.StoryRenderer(options);

        assert.equal($('.block').length, 1);
      });
    });

    describe('with no insertion hint element defined', function() {
      it('should throw', function() {
        var optionsWithoutInsertionHintElement = _.omit(options, 'insertionHintElement');
        assert.throws(function() {
          new storyteller.StoryRenderer(optionsWithoutInsertionHintElement); //eslint-disable-line no-new
        });
      });
    });

    describe('insertion hint', function() {

      describe('with a story that has blocks', function() {

        describe('when no insertionHintIndex has been set', function() {

          it('renders blocks but no insertion hint', function() {

            storyteller.storyRenderer = new storyteller.StoryRenderer(options);

            assert($('.block').length > 0, 'there is more than one block');
            assert.isTrue($('.insertion-hint').hasClass('hidden'), 'insertion hint is hidden');
          });
        });
      });
    });
  });

  describe('drag-and-drop insertion hint', function() {

    beforeEach(function() {

      $('body').append([
        $('<div>', { 'class': 'insertion-hint hidden' }),
        $('<div>', { 'id': 'rich-text-editor-toolbar' })
      ]);

      validToolbar = Object.create(storyteller.RichTextEditorToolbar.prototype);
      validFormats = [];

      storyteller.richTextEditorManager = new storyteller.RichTextEditorManager(
        storyteller.assetFinder,
        validToolbar,
        validFormats
      );

      options.editable = true;

      storyteller.storyRenderer = new storyteller.StoryRenderer(options);
    });

    afterEach(function() {

      $('#rich-text-editor-toolbar').remove();
    });

    function hintAtStoryAndBlock(storyUidToHint, blockIdToHint) {

      // Cause DropHintStore to indicate we're dragging over
      // the given story and block.
      storyteller.dispatcher.dispatch({
        action: Actions.STORY_DRAG_OVER,
        storyUid: storyUidToHint,
        blockId: blockIdToHint,
        pointer: {},
        storyElement: {}
      });
    }

    function noHint() {

      // Cause DropHintStore to indicate we're dragging over
      // nothing at all.
      storyteller.dispatcher.dispatch({
        action: Actions.STORY_DRAG_LEAVE,
        storyUid: storyUid
      });
    }

    describe('with a drag hint not on this story', function() {
      beforeEach(function() {
        hintAtStoryAndBlock('notm-ystr', 0);
      });

      it('should be hidden', function() {
        assert.isTrue(
          options.insertionHintElement.hasClass('hidden'),
          'insertion hint is not shown'
        );
      });
    });

    describe('with a drag hint on this story', function() {
      beforeEach(function() {
        hintAtStoryAndBlock(storyUid, textBlockId);
      });

      it('is shown', function() {
        assert.isFalse(
          options.insertionHintElement.hasClass('hidden'),
          'insertion hint is shown'
        );
      });

      describe('that was removed by clearing all hints', function() {
        beforeEach(function() {
          noHint();
        });

        it('is not shown', function() {
          assert.isTrue(
            options.insertionHintElement.hasClass('hidden'),
            'insertion hint is not shown'
          );
        });

      });

      describe('that was removed by changing to another story', function() {
        beforeEach(function() {
          hintAtStoryAndBlock('notm-ystr', 0);
        });

        it('is not shown', function() {
          assert.isTrue(
            options.insertionHintElement.hasClass('hidden'),
            'insertion hint is not shown'
          );
        });

      });
    });
  });
});
