import $ from 'jQuery';
import _ from 'lodash';
import SocrataVisualizations from 'socrata-visualizations';

import I18n from './I18n';
import Actions from './Actions';
import DragDrop from './DragDrop';
import ErrorReporter from '../services/ErrorReporter';
import Environment from '../StorytellerEnvironment';
import StorytellerUtils from '../StorytellerUtils';
import Renderers from './renderers';
import './components';
import { dispatcher } from './Dispatcher';
import { storyStore } from './stores/StoryStore';
import { storySaveStatusStore } from './stores/StorySaveStatusStore';
import { richTextEditorManager } from './RichTextEditorManager';
import { exceptionNotifier } from '../services/ExceptionNotifier';
import CollaboratorsDataProvider from './CollaboratorsDataProvider';

dispatcher.register(function(payload) {
  if (Environment.ENVIRONMENT === 'development' && window.console) {
    console.info('Dispatcher action: ', payload);
  }

  if (typeof payload.action !== 'string') {
    throw new Error(
      'Undefined action.'
    );
  }
});

dispatcher.dispatch({
  action: Actions.STORY_CREATE,
  data: Environment.STORY_DATA
});

(new ErrorReporter());

(new CollaboratorsDataProvider(Environment.STORY_UID)).
  getCollaborators().
    then(
      function(collaborators) {

        dispatcher.dispatch({
          action: Actions.COLLABORATORS_LOAD,
          collaborators: collaborators
        });
      }
    ).
    catch(exceptionNotifier.notify);

$(document).on('ready', function() {
  /**
   * Setup
   */

  SocrataVisualizations.views.RowInspector.setup();

  /*eslint-disable no-unused-vars */
  var assetSelectorRenderer = new Renderers.AssetSelectorRenderer({
    assetSelectorContainerElement: $('#asset-selector-container')
  });

  var linkModalRenderer = new Renderers.LinkModalRenderer();
  var errorModalRenderer = new Renderers.ErrorModalRenderer();
  var linkTipRenderer = new Renderers.LinkTipRenderer();
  var collaboratorsRenderer = new Renderers.CollaboratorsRenderer();
  var shareAndEmbedRenderer = new Renderers.ShareAndEmbedRenderer();
  var loginWindowRenderer = new Renderers.LoginWindowRenderer();

  var storyCopierRenderer = new Renderers.StoryCopierRenderer({
    storyCopierContainerElement: $('#make-a-copy-container')
  });

  var userStoryRenderer = new Renderers.StoryRenderer({
    storyUid: Environment.STORY_UID,
    storyContainerElement: $('.user-story'),
    editable: true,
    insertionHintElement: $('#story-insertion-hint'),
    richTextEditorManager: richTextEditorManager,
    warningMessageElement: $('.user-story .message-warning')
  });
  /*eslint-enable no-unused-vars */

  /**
   * RichTextEditorToolbar events
   */

  $(window).on('rich-text-editor::focus-change', function(event) {
    var editors;
    var currentEditorId;

    // If an editor is being focused, we must switch the link toolbar's context,
    // and deselect all other editors.
    if (event.originalEvent.detail.isFocused === true) {
      currentEditorId = event.originalEvent.detail.id;
      editors = _.omit(richTextEditorManager.getAllEditors(), currentEditorId);

      richTextEditorManager.linkToolbar(currentEditorId);
      _.invoke(editors, 'deselect');
    }
  });

  $(window).on('click', function(event) {
    var target = $(event.target);

    var isInToolbar = target.is($('#rich-text-editor-toolbar')) || target.parents('#rich-text-editor-toolbar').length !== 0;
    var isInLinkModal = target.is($('#link-modal')) || target.parents('#link-modal').length !== 0;
    var isInLinkTip = target.is($('#link-tip')) || target.parents('#link-tip').length !== 0;

    // If the target of the click event is not the toolbar, unlink
    // the toolbar from the current ext editor (which also dims the
    // toolbar), and deselect all rich text editors.
    if (!isInToolbar && !isInLinkModal && !isInLinkTip) {
      richTextEditorManager.unlinkToolbar();

      dispatcher.dispatch({
        action: Actions.RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS,
        activeFormats: []
      });

      dispatcher.dispatch({
        action: Actions.LINK_TIP_CLOSE
      });

      _.invoke(richTextEditorManager.getAllEditors(), 'deselect');
    }
  });

  StorytellerUtils.preventFormAutoSubmit();

  /**
   * History events
   */

  $('.undo-btn').on('click', function() {
    dispatcher.dispatch({
      action: Actions.HISTORY_UNDO,
      storyUid: Environment.STORY_UID
    });
  });

  $('.redo-btn').on('click', function() {
    dispatcher.dispatch({
      action: Actions.HISTORY_REDO,
      storyUid: Environment.STORY_UID
    });
  });

  storyStore.addChangeListener(function() {
    if (storyStore.canUndo()) {
      $('.undo-btn').prop('disabled', false);
    } else {
      $('.undo-btn').prop('disabled', true);
    }

    if (storyStore.canRedo()) {
      $('.redo-btn').prop('disabled', false);
    } else {
      $('.redo-btn').prop('disabled', true);
    }
  });

  // Respond to changes in the user story's block ordering by scrolling the
  // window to always show the top of the moved block.
  dispatcher.register(function(payload) {
    if (payload.storyUid === Environment.STORY_UID) {
      switch (payload.action) {
        case Actions.STORY_MOVE_BLOCK_UP:
        case Actions.STORY_MOVE_BLOCK_DOWN:

          // Ensure that the layout is performed before we try to read
          // back the y translate value. Since the renderer is synchronous
          // a minimal setTimeout here should cause this block to be executed
          // after the renderer has completed.
          setTimeout(function() {

            var blockEditElement = document.querySelectorAll(
              '.block-edit[data-block-id="' + payload.blockId + '"]'
            )[0];

            var blockEditElementTranslateY =
              parseInt(
                blockEditElement.getAttribute('data-translate-y'),
                10
              ) || 0;

            $('html, body').animate({
              scrollTop: blockEditElementTranslateY
            });
          // The duration of the layout translations is specified in
          // `layout.scss`.
          }, 200);
          break;

        default:
          break;
      }
    }
  });

  /**
   * Set up controls/widgets
   */

  // Add Content Panel
  var addContentPanelElement = $('#add-content-panel');
  addContentPanelElement.addContentPanel($('.quick-action-menu [data-panel-toggle="add-content-panel"]'));

  // Style and Presentation Panel
  var styleAndPresentationPanelElement = $('#style-and-presentation-panel');
  styleAndPresentationPanelElement.styleAndPresentationPanel($('.quick-action-menu button[data-panel-toggle="style-and-presentation-panel"]'));

  // Settings Panel
  var settingsPanelContainer = $('#settings-panel-container');
  settingsPanelContainer.settingsPanel($('[data-panel-toggle="settings-panel"]'));

  // Drag-drop
  var ghostElement = $('#block-ghost');
  var dragDrop = StorytellerUtils.export(
    new DragDrop(addContentPanelElement.find('.inspiration-block'), ghostElement),
    'storyteller.dragDrop'
  );

  dragDrop.setup();

  // Story title
  $('title, .story-title').storyTitle(Environment.STORY_UID);

  // Draft or Published status
  $('#story-publication-status').storyPublicationStatus(Environment.STORY_UID);

  // Save status
  $('#story-saving-indicator').storySavingStatus();
  $('#story-save-error-bar').storySaveErrorBar();

  // Preview button
  $('.preview-btn').storyPreviewLink();

  // Close confirmation
  $(window).on('beforeunload', function() {
    if (
      storySaveStatusStore.isStoryDirty() ||
      storySaveStatusStore.isStorySaveInProgress()
    ) {
      // If the save is impossible, don't bother confirming the close :(
      if (!storySaveStatusStore.isSaveImpossibleDueToConflict()) {
        return I18n.t('editor.page_close_confirmation');
      }
    }
  });
});

