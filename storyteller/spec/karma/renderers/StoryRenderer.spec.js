import $ from 'jquery';
import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
import DataGenerators from '../DataGenerators';
import I18nMocker from '../I18nMocker';
import Dispatcher from 'editor/Dispatcher';
import Actions from 'editor/Actions';
import CustomEvent from 'CustomEvent';
import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import {__RewireAPI__ as componentHTMLAPI} from 'editor/block-component-renderers/componentHTML';
import Constants from 'editor/Constants';
import StoryStore from 'editor/stores/StoryStore';
import DropHintStore, {__RewireAPI__ as DropHintStoreAPI} from 'editor/stores/DropHintStore';
import WindowSizeBreakpointStore from 'editor/stores/WindowSizeBreakpointStore';
import StoryRenderer, {__RewireAPI__ as StoryRendererAPI} from 'editor/renderers/StoryRenderer';
import StorytellerUtils from 'StorytellerUtils';
import RichTextEditorToolbar from 'editor/RichTextEditorToolbar';
import RichTextEditorManager from 'editor/RichTextEditorManager';

describe('StoryRenderer', function() {

  var storyUid = 'what-what';
  var assetSelectorBlockId;
  var textBlockId;
  var options;
  var validToolbar;
  var validFormats;
  var storyRenderer;
  var richTextEditorManager;
  var dispatcher;
  var storyStore;
  var windowSizeBreakpointStore;
  var dropHintStore;
  var moveComponentStore;

  beforeEach(function() {
    $transient.append([
      $('<div>', { 'class': 'insertion-hint hidden' }),
      $('<div>', { 'id': 'rich-text-editor-toolbar' })
    ]);

    validToolbar = Object.create(RichTextEditorToolbar.prototype);
    validFormats = Constants.RICH_TEXT_FORMATS;

    richTextEditorManager = new RichTextEditorManager(
      validToolbar,
      validFormats
    );

    dispatcher = new Dispatcher();
    StoreAPI.__Rewire__('dispatcher', dispatcher);

    storyStore = new StoryStore();
    windowSizeBreakpointStore = new WindowSizeBreakpointStore();

    DropHintStoreAPI.__Rewire__('storyStore', storyStore);
    dropHintStore = new DropHintStore();

    moveComponentStore = {
      isUserChoosingMoveDestination: _.constant(false),
      isComponentBeingMoved: _.constant(false),
      isComponentValidMoveDestination: _.constant(false),
      addChangeListener: _.noop
    };

    StoryRendererAPI.__Rewire__('moveComponentStore', moveComponentStore);
    StoryRendererAPI.__Rewire__('storyStore', storyStore);
    StoryRendererAPI.__Rewire__('dropHintStore', dropHintStore);
    StoryRendererAPI.__Rewire__('richTextEditorManager', richTextEditorManager);
    StoryRendererAPI.__Rewire__('windowSizeBreakpointStore', windowSizeBreakpointStore);
    StoryRendererAPI.__Rewire__('I18n', I18nMocker);

    sinon.stub(StorytellerUtils, 'fetchDomainStrings');
    StoryRendererAPI.__Rewire__('StorytellerUtils', StorytellerUtils);

    componentHTMLAPI.__Rewire__('richTextEditorManager', richTextEditorManager);

    dispatcher.dispatch({
      action: Actions.STORY_CREATE,
      data: DataGenerators.generateStoryData({
        uid: storyUid,
        blocks: [
          DataGenerators.generateBlockData({
            layout: '12',
            components: [
              {type: 'assetSelector'}
            ]
          }),
          DataGenerators.generateBlockData({
            layout: '12',
            components: [
              {type: 'html', value: '<p>hello</p>'}
            ]
          })
        ]
      })
    });

    var blockIds = storyStore.getStoryBlockIds(storyUid);
    assetSelectorBlockId = blockIds[0];
    textBlockId = blockIds[1];

    $transient.append(
        $('<div>', { 'class': 'story-container' })
      ).append(
        $('<p>', { 'class': 'message-warning' })
      ).append(
        $('<div>', { 'class': 'insertion-hint' })
      );

    options = {
      storyUid: storyUid,
      storyContainerElement: $transient.find('.story-container'),
      warningMessageElement: $transient.find('.message-warning'),
      insertionHintElement: $transient.find('.insertion-hint')
    };
  });

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
    DropHintStoreAPI.__ResetDependency__('storyStore');
    componentHTMLAPI.__ResetDependency__('richTextEditorManager');

    StoryRendererAPI.__ResetDependency__('storyStore');
    StoryRendererAPI.__ResetDependency__('dropHintStore');
    StoryRendererAPI.__ResetDependency__('richTextEditorManager');
    StoryRendererAPI.__ResetDependency__('windowSizeBreakpointStore');
    StoryRendererAPI.__ResetDependency__('I18n');

    StorytellerUtils.fetchDomainStrings.restore();

    if (storyRenderer) {
      storyRenderer.destroy();
    }
  });

  describe('constructor', function() {
    describe('when passed a configuration object', function() {
      describe('with a storyUid property that is not a string', function() {
        it('raises an exception', function() {
          options.storyUid = {};

          assert.throws(function() {
            storyRenderer = new StoryRenderer(options);
          });
        });
      });

      describe('with a storyContainerElement property that is not a jQuery object', function() {
        it('raises an exception', function() {
          options.storyContainerElement = {};

          assert.throws(function() {
            storyRenderer = new StoryRenderer(options);
          });
        });
      });

      describe('with a storyContainerElement property that is a jQuery object', function() {
        it('adds a data-story-uid attr to the storyContainerElement', function() {
          var uid = options.storyContainerElement.attr('data-story-uid');
          assert.isUndefined(uid);

          storyRenderer = new StoryRenderer(options);
          uid = options.storyContainerElement.attr('data-story-uid');
          assert.equal(uid, options.storyUid);
        });
      });

      describe('with an insertionHintElement property that is not a jQuery object', function() {
        it('raises an exception', function() {
          options.insertionHintElement = {};

          assert.throws(function() {
            storyRenderer = new StoryRenderer(options);
          });
        });
      });

      describe('with an insertionHintElement property that is a jQuery object', function() {
        it('adds a data-story-uid attr to the insertionHintElement', function() {
          var uid = options.insertionHintElement.attr('data-story-uid');
          assert.isUndefined(uid);

          storyRenderer = new StoryRenderer(options);
          uid = options.insertionHintElement.attr('data-story-uid');
          assert.equal(uid, options.storyUid);
        });
      });

      describe('without a richTextEditorManager', function() {
        beforeEach(function() {
          StoryRendererAPI.__Rewire__('richTextEditorManager', {});
        });

        afterEach(function() {
          StoryRendererAPI.__ResetDependency__('richTextEditorManager');
        });

        it('raises an exception', function() {
          assert.throws(function() {
            storyRenderer = new StoryRenderer(options);
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

    describe('that does not exist', function() {
      it('should not throw', function() {
        options.storyUid = 'nope-nope';
        storyRenderer = new StoryRenderer(options);
      });
    });

    describe('window size class', function() {
      it('should apply the current class break to the story container', function() {
        storyRenderer = new StoryRenderer(options);

        var currentClassName = windowSizeBreakpointStore.getWindowSizeClass();

        assert.isTrue(options.storyContainerElement.hasClass(currentClassName));
      });
    });

    describe('that is empty', function() {
      it('should display an empty story message', function() {
        var storyWithoutBlocks = DataGenerators.generateStoryData({
          uid: 'empt-yyyy',
          blocks: []
        });

        dispatcher.dispatch({
          action: Actions.STORY_CREATE,
          data: storyWithoutBlocks
        });

        options.storyUid = 'empt-yyyy';
        storyRenderer = new StoryRenderer(options);

        assert.equal($('.message-warning.message-empty-story').length, 1);
        assert.isAbove($('.message-empty-story').text().length, 1);
        assert.isTrue(I18nMocker.t.calledWith('editor.empty_story_warning'));
      });
    });

    describe('with a story that has blocks', function() {
      it('renders blocks', function() {
        storyRenderer = new StoryRenderer(options);
        var numberOfBlocks = storyStore.getStoryBlockIds(storyUid).length;

        assert.equal($('.block').length, numberOfBlocks);
      });

      it('does not render deleted blocks', function() {
        storyRenderer = new StoryRenderer(options);
        var numberOfBlocks = storyStore.getStoryBlockIds(storyUid).length;

        dispatcher.dispatch({
          action: Actions.STORY_DELETE_BLOCK,
          storyUid: storyUid,
          blockId: assetSelectorBlockId
        });

        assert.equal($('.block').length, numberOfBlocks - 1);
      });

      it('does not render the empty story warning', function() {
        storyRenderer = new StoryRenderer(options);

        assert.equal($('.message-empty-story').length, 0);
      });

      describe('with a story that has text over media blocks', function() {
        describe('when the block\'s layout is 12-12', function() {
          beforeEach(function() {
            dispatcher.dispatch({
              action: Actions.STORY_INSERT_BLOCK,
              storyUid: storyUid,
              insertAt: 0,
              blockContent: DataGenerators.generateBlockData({
                layout: '12-12',
                components: [
                  {type: 'html', value: 'hello'},
                  {type: 'assetSelector'}
                ]
              })
            });

            storyRenderer = new StoryRenderer(options);
          });

          it('contains exactly two 12\'s', function() {
            // Check if there are two adjacent .col12's
            assert.lengthOf(
              $('.block > .col12.component-container + .col12.component-container'),
              1
            );
          });
        });

        describe('when the block\'s layout is 12-12-12-12', function() {
          beforeEach(function() {
            dispatcher.dispatch({
              action: Actions.STORY_INSERT_BLOCK,
              storyUid: storyUid,
              insertAt: 0,
              blockContent: DataGenerators.generateBlockData({
                layout: '12-12-12-12',
                components: [
                  {type: 'html', value: 'hello'},
                  {type: 'assetSelector'},
                  {type: 'html', value: 'world'},
                  {type: 'assetSelector'}
                ]
              })
            });

            storyRenderer = new StoryRenderer(options);
          });

          it('wraps 12-12-12-12 in two .col6s', function() {
            assert.lengthOf(
              $('.block .col6:not(.component-container)'),
              2
            );
          });

          it('contains exactly four 12\'s', function() {
            assert.lengthOf(
              $('.block .col6 .col12.component-container'),
              4
            );
          });
        });
      });
    });

    describe('with a story that has blocks including a goal.embed component', () => {
      let storyGoalEmbed;

      beforeEach(() => {
        storyGoalEmbed = 'goal-embd';

        dispatcher.dispatch({
          action: Actions.STORY_CREATE,
          data: DataGenerators.generateStoryData({
            uid: storyGoalEmbed,
            blocks: [
              DataGenerators.generateBlockData({
                components: [
                  { type: 'goal.embed', value: { uid: 'open-perf' } }
                ]
              })
            ]
          })
        });
      });

      it('renders a goal.embed block without delete', () => {
        options.storyUid = storyGoalEmbed;
        storyRenderer = new StoryRenderer(options);

        assert.lengthOf(
          $('.block-edit-controls-without-delete'),
          1
        );

        assert.lengthOf(
          $('.block-edit-controls-delete-btn'),
          0
        );
      });
    });

    describe('with a story that has blocks including an image component', function() {
      var imageOnlyStoryUid = 'with-imge';

      beforeEach(function() {
        var storyWithOnlyImage = DataGenerators.generateStoryData({
          uid: imageOnlyStoryUid,
          blocks: [
            DataGenerators.generateBlockData({
              components: [
                { type: 'image', value: { url: 'https://example.com/image.png', documentId: '1234' } }
              ]
            })
          ]
        });

        dispatcher.dispatch({
          action: Actions.STORY_CREATE,
          data: storyWithOnlyImage
        });
      });

      it('renders blocks', function() {
        options.storyUid = imageOnlyStoryUid;
        storyRenderer = new StoryRenderer(options);

        assert.equal($('.block').length, 1);
      });

      describe('that cause a mid-render rerender', function() {
        it('completes the current render before starting a new render', function() {
          var rendering = false;

          var imageRenderStub = sinon.stub($.fn, 'componentImage').callsFake(function() {
            assert.isFalse(rendering, 'reentrant call to renderer'); // Shouldn't re-enter.
            rendering = true;

            // Cause a rerender the first render.
            if (imageRenderStub.calledOnce) {
              this[0].dispatchEvent(
                new CustomEvent(
                  'component::height-change',
                  { detail: {}, bubbles: true }
                )
              );
            }
            rendering = false;
          });

          options.storyUid = imageOnlyStoryUid;
          storyRenderer = new StoryRenderer(options);

          sinon.assert.calledTwice(imageRenderStub);

        });
      });

    });

    describe('with no insertion hint element defined', function() {
      it('should throw', function() {
        var optionsWithoutInsertionHintElement = _.omit(options, 'insertionHintElement');
        assert.throws(function() {
          new StoryRenderer(optionsWithoutInsertionHintElement); //eslint-disable-line no-new
        });
      });
    });

    describe('insertion hint', function() {
      describe('with a story that has blocks', function() {
        describe('when no insertionHintIndex has been set', function() {
          it('renders blocks but no insertion hint', function() {
            storyRenderer = new StoryRenderer(options);

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

      validToolbar = Object.create(RichTextEditorToolbar.prototype);
      validFormats = [];

      richTextEditorManager = new RichTextEditorManager(
        validToolbar,
        validFormats
      );

      storyRenderer = new StoryRenderer(options);
    });

    afterEach(function() {
      $('#rich-text-editor-toolbar').remove();
    });

    function hintAtStoryAndBlock(storyUidToHint, blockIdToHint) {

      // Cause DropHintStore to indicate we're dragging over
      // the given story and block.
      dispatcher.dispatch({
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
      dispatcher.dispatch({
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
