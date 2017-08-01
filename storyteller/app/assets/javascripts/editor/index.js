import 'babel-polyfill';
import $ from 'jquery';
import _ from 'lodash';
import React from 'react'; //eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import SocrataVisualizations from 'common/visualizations';

import I18n from './I18n';
import Actions from './Actions';
import DragDrop from './DragDrop';
import GoalMigrationRunner from './GoalMigrationRunner';
import ErrorReporter from '../services/ErrorReporter';
import Environment from '../StorytellerEnvironment';
import StorytellerUtils from '../StorytellerUtils';
import Renderers from './renderers';
import './components';
import { dispatcher } from './Dispatcher';
import { storyStore } from './stores/StoryStore';
import { storySaveStatusStore } from './stores/StorySaveStatusStore';
import { goalMigrationStore } from './stores/GoalMigrationStore';
import { richTextEditorManager } from './RichTextEditorManager';
import { exceptionNotifier } from '../services/ExceptionNotifier';
import CollaboratorsDataProvider from './CollaboratorsDataProvider';
import StoryPublicationStatus from './components/StoryPublicationStatus'; //eslint-disable-line no-unused-vars
import MostRecentlyUsed from 'common/most_recently_used';

import 'common/notifications/main';

const {
  ENVIRONMENT,
  IS_GOAL,
  OP_GOAL_NARRATIVE_MIGRATION_METADATA,
  PUBLISHED_STORY_DATA,
  STORY_DATA,
  STORY_UID
} = Environment;

const shouldMigrateGoal = goalMigrationStore.needsMigration();
const shouldShowMigrationOverlay = goalMigrationStore.needsOverlay();

dispatcher.register((payload) => {
  if (ENVIRONMENT === 'development' && window.console) {
    console.info('Dispatcher action: ', payload);
  }

  if (typeof payload.action !== 'string') {
    throw new Error(
      'Undefined action.'
    );
  }
});

if (!shouldMigrateGoal) {
  dispatcher.dispatch({
    action: Actions.STORY_CREATE,
    data: STORY_DATA
  });
  dispatcher.dispatch({
    action: Actions.STORY_SET_PUBLISHED_STORY,
    storyUid: STORY_UID,
    publishedStory: PUBLISHED_STORY_DATA
  });
}

(new ErrorReporter());

if (!IS_GOAL) {
  // TODO: Why is this being called from index? Can the store manage it itself?
  (new CollaboratorsDataProvider()).getCollaborators().
    then((collaborators) => {
      dispatcher.dispatch({
        action: Actions.COLLABORATORS_LOAD,
        collaborators: collaborators
      });
    }).
    catch(exceptionNotifier.notify);
}

const $window = $(window);

$(document).on('ready', () => {
  /**
   * Setup
   */

  SocrataVisualizations.views.RowInspector.setup();

  new Renderers.LinkModalRenderer();
  new Renderers.ErrorModalRenderer();
  new Renderers.LinkTipRenderer();
  new Renderers.CollaboratorsRenderer();
  new Renderers.ShareAndEmbedRenderer();
  new Renderers.LoginWindowRenderer();

  new Renderers.AssetSelectorRenderer({
    assetSelectorContainerElement: $('#asset-selector-container')
  });

  new Renderers.StoryCopierRenderer({
    storyCopierContainerElement: $('#make-a-copy-container')
  });

  new Renderers.StoryRenderer({
    storyUid: STORY_UID,
    editable: true,
    richTextEditorManager: richTextEditorManager,
    insertionHintElement: $('#story-insertion-hint'),
    storyContainerElement: $('.user-story'),
    warningMessageElement: $('.user-story .message-warning')
  });

  /* Goal migration */
  if (shouldMigrateGoal) {
    if (shouldShowMigrationOverlay) {
      new Renderers.GoalMigrationOverlayRenderer();
    }

    // Need to migrate narrative first. Ideally we'd do this server-side,
    // but it's easier in JS (the original renderer and support utilities
    // used to process the narrative in Odysseus are in JS).
    // StoryStore will load the story automatically when migration is complete.
    (new GoalMigrationRunner(OP_GOAL_NARRATIVE_MIGRATION_METADATA, STORY_DATA)).run();
  }

  /**
   * RichTextEditorToolbar events
   */

  $window.on('rich-text-editor::focus-change', (event) => {
    const { isFocused, id } = event.originalEvent.detail;

    // If an editor is being focused, we must switch the link toolbar's context,
    // and deselect all other editors.
    if (isFocused === true) {
      const otherEditors = _.omit(richTextEditorManager.getAllEditors(), id);

      richTextEditorManager.linkToolbar(id);
      _.invokeMap(otherEditors, 'deselect');
    }
  });

  $window.on('click', (event) => {
    const target = $(event.target);

    function isSelfOrAncestor(selector) {
      return target.is(selector) || target.parents(selector).length !== 0;
    }

    const isInToolbar = isSelfOrAncestor('#rich-text-editor-toolbar');
    const isInLinkModal = isSelfOrAncestor('#link-modal');
    const isInLinkTip = isSelfOrAncestor('#link-tip');

    // If the target of the click event is not the toolbar or a link modal/tip,
    // unlink the toolbar from the current text editor (which also dims the
    // toolbar) and deselect all rich text editors.
    if (!isInToolbar && !isInLinkModal && !isInLinkTip) {
      richTextEditorManager.unlinkToolbar();

      dispatcher.dispatch({
        action: Actions.RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS,
        activeFormats: []
      });

      dispatcher.dispatch({
        action: Actions.LINK_TIP_CLOSE
      });

      _.invokeMap(richTextEditorManager.getAllEditors(), 'deselect');
    }
  });

  StorytellerUtils.preventFormAutoSubmit();

  /**
   * History events
   */

  const undoBtn = $('.undo-btn');
  const redoBtn = $('.redo-btn');

  undoBtn.on('click', () => {
    dispatcher.dispatch({
      action: Actions.HISTORY_UNDO,
      storyUid: STORY_UID
    });
  });

  redoBtn.on('click', () => {
    dispatcher.dispatch({
      action: Actions.HISTORY_REDO,
      storyUid: STORY_UID
    });
  });

  storyStore.addChangeListener(() => {
    undoBtn.prop('disabled', !storyStore.canUndo());
    redoBtn.prop('disabled', !storyStore.canRedo());
  });

  // Respond to changes in the user story's block ordering by scrolling the
  // window to always show the top of the moved block.
  const htmlAndBody = $('html, body');
  dispatcher.register((payload) => {
    if (payload.storyUid === STORY_UID) {
      switch (payload.action) {
        case Actions.STORY_MOVE_BLOCK_UP:
        case Actions.STORY_MOVE_BLOCK_DOWN:

          // Ensure that the layout is performed before we try to read
          // back the y translate value. Since the renderer is synchronous
          // a minimal setTimeout here should cause this block to be executed
          // after the renderer has completed.
          setTimeout(() => {

            const blockEditElement = document.querySelectorAll(
              `.block-edit[data-block-id="${payload.blockId}"]`
            )[0];

            const translateY = parseInt(
              blockEditElement.getAttribute('data-translate-y'), 10
            ) || 0;

            htmlAndBody.animate({
              scrollTop: translateY
            });
          // The duration of layout translations is specified in `layout.scss`.
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
  const addContentPanel = $('#add-content-panel');
  const addContentPanelToggle = $('[data-panel-toggle="add-content-panel"]');
  addContentPanel.addContentPanel(addContentPanelToggle);

  // Style and Presentation Panel
  const styleAndPresentationPanel = $('#style-and-presentation-panel');
  const styleAndPresentationPanelToggle = $('[data-panel-toggle="style-and-presentation-panel"]');
  styleAndPresentationPanel.styleAndPresentationPanel(styleAndPresentationPanelToggle);

  // Settings Panel
  const settingsPanel = $('#settings-panel-container');
  const settingsPanelToggle = $('[data-panel-toggle="settings-panel"]');
  settingsPanel.settingsPanel(settingsPanelToggle);

  // Drag-drop
  const ghostElement = $('#block-ghost');
  const dragDrop = StorytellerUtils.export(
    new DragDrop(addContentPanel.find('.inspiration-block'), ghostElement),
    'storyteller.dragDrop'
  );

  dragDrop.setup();

  // Story title
  $('title, .story-title').storyTitle(STORY_UID);

  // Draft or Published status
  function renderStoryPublicationStatus() {
    ReactDOM.render(
      <StoryPublicationStatus />,
      document.getElementById('story-publication-status')
    );
  }

  storySaveStatusStore.addChangeListener(renderStoryPublicationStatus);
  storyStore.addChangeListener(renderStoryPublicationStatus);
  renderStoryPublicationStatus();

  // Downtime notice
  $('#downtime-notice-bar').downtimeNoticeBar();

  // Save status
  $('#story-saving-indicator').storySavingStatus();
  $('#story-save-error-bar').storySaveErrorBar();

  // Preview button
  $('.preview-btn').storyPreviewLink();

  // Close confirmation
  $window.on('beforeunload', () => {
    const isDirty = storySaveStatusStore.isStoryDirty();
    const isSaveInProgress = storySaveStatusStore.isStorySaveInProgress();
    const isSaveImpossible = storySaveStatusStore.isSaveImpossibleDueToConflict();

    if ((isDirty || isSaveInProgress) && !isSaveImpossible) {
      return I18n.t('editor.page_close_confirmation');
    }
  });

  $('#moving-cancel-header').click(() => {
    dispatcher.dispatch({
      action: Actions.MOVE_COMPONENT_CANCEL
    });
  });

  if (Environment.CURRENT_USER && Environment.STORY_UID) {
    new MostRecentlyUsed({namespace: `socrata:assets:mru:${Environment.CURRENT_USER.id}`}).add(Environment.STORY_UID);
  }
});
