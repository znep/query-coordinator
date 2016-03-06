import $ from 'jQuery';
import 'jQuery-sidebar';

import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import StoryPermissionsRenderer from '../renderers/StoryPermissionsRenderer';
import StorytellerUtils from '../../StorytellerUtils';
import { dispatcher } from '../Dispatcher';
import { shareAndEmbedStore } from '../stores/ShareAndEmbedStore';
import { collaboratorsStore } from '../stores/CollaboratorsStore';
import { storyCopierStore } from '../stores/StoryCopierStore';
import { storyStore } from '../stores/StoryStore';
import { coreSavingStore } from '../stores/CoreSavingStore';

/**
 * Instantiates an SettingsPanel control with the given
 * toggle button. When the user clicks the toggle button,
 * the panel will toggle open or closed.
 *
 * The toggleButton will be given a class of 'active' while
 * the panel is open, as will the settingsContainer, for control of the overlay
 *
 * @param {jQuery} toggleButton - a jQuery reference to the desired toggle button node.
 */
$.fn.settingsPanel = SettingsPanel;

export default function SettingsPanel(toggleButton) {
  StorytellerUtils.assertInstanceOf(toggleButton, $);

  var settingsContainer = $(this);
  var settingsPanel = settingsContainer.find('.settings-panel').sidebar({
    side: 'left'
  });
  var saveButton = settingsContainer.find('.settings-save-btn');
  var saveErrorMessage = settingsContainer.find('.settings-save-failure-message');
  var saveErrorMessageDetails = settingsContainer.find('.settings-save-failure-message-details');

  var storyTitleInputBox = settingsContainer.find('form input[type="text"]');
  var storyDescriptionTextarea = settingsContainer.find('textarea');

  var metadataStateAtPanelOpenTime = null;
  var saveWasInProgress = false;

  var storyPermissionsRenderer = new StoryPermissionsRenderer(); //eslint-disable-line no-unused-vars

  coreSavingStore.addChangeListener(function() {
    var saveInProgress = coreSavingStore.isSaveInProgress();
    var lastSaveError = coreSavingStore.lastRequestSaveErrorForStory(
      Environment.STORY_UID
    );

    saveButton.toggleClass('busy', saveInProgress);
    saveButton.toggleClass('btn-busy', saveInProgress);

    saveErrorMessage.toggleClass('active', lastSaveError !== null);
    saveErrorMessageDetails.text(lastSaveError);
  });

  function loadCurrentMetadata() {
    metadataStateAtPanelOpenTime = {
      title: storyStore.getStoryTitle(Environment.STORY_UID),
      description: storyStore.getStoryDescription(Environment.STORY_UID)
    };

    storyTitleInputBox.val(
      metadataStateAtPanelOpenTime.title
    );
    storyDescriptionTextarea.val(
      metadataStateAtPanelOpenTime.description
    );

    updateSaveButtonEnabledState();
  }

  function isTitleChanged() {
    var titleAtOpenTime = metadataStateAtPanelOpenTime.title;
    var titleInBox = storyTitleInputBox.val();
    var areDifferentTitles = titleAtOpenTime !== titleInBox;
    var isNotEmpty = titleInBox.length > 0;

    return areDifferentTitles && isNotEmpty;
  }

  function isDescriptionChanged() {
    var descriptionAtOpenTime = metadataStateAtPanelOpenTime.description;
    var descriptionInBox = storyDescriptionTextarea.val();

    return descriptionAtOpenTime !== descriptionInBox;
  }

  function updateSaveButtonEnabledState() {
    var hasChanges;
    var hasError;

    if (!metadataStateAtPanelOpenTime) {
      // Panel is closed, we don't care.
      // This function gets called whenever
      // one of several Stores change (StoryStore,
      // in particular).
      return;
    }

    hasChanges = isTitleChanged() || isDescriptionChanged();
    hasError = coreSavingStore.lastRequestSaveErrorForStory(Environment.STORY_UID) !== null;

    saveButton.attr(
      'disabled',
      !hasChanges && !hasError
    );
  }

  function saveMetadata() {
    if (isTitleChanged()) {
      dispatcher.dispatch({
        action: Actions.STORY_SET_TITLE,
        storyUid: Environment.STORY_UID,
        title: storyTitleInputBox.val()
      });
    }

    if (isDescriptionChanged()) {
      dispatcher.dispatch({
        action: Actions.STORY_SET_DESCRIPTION,
        storyUid: Environment.STORY_UID,
        description: storyDescriptionTextarea.val()
      });
    }

    dispatcher.dispatch({
      action: Actions.STORY_SAVE_METADATA,
      storyUid: Environment.STORY_UID
    });
  }

  function dispatchActions(event) {
    var action = event.target.getAttribute('data-action') ?
      event.target.getAttribute('data-action') :
      $(event.target).parent('[data-action]').attr('data-action');

    switch (action) {
      case Actions.COLLABORATORS_OPEN:
        dispatcher.dispatch({
          action: Actions.COLLABORATORS_OPEN
        });
        break;
      case Actions.STORY_MAKE_COPY_MODAL_OPEN:
        dispatcher.dispatch({
          action: Actions.STORY_MAKE_COPY_MODAL_OPEN
        });
        break;
      case Actions.SHARE_AND_EMBED_MODAL_OPEN:
        dispatcher.dispatch({
          action: Actions.SHARE_AND_EMBED_MODAL_OPEN
        });
        break;
    }
  }

  // Set up some input events.

  toggleButton.on('click', function() {
    settingsPanel.trigger('sidebar:toggle');
  });

  $('.settings-panel .menu-list-item-header.expandable').click(function(event) {
    $(event.currentTarget).
      toggleClass('active').
      siblings('.menu-list-item-content').
        toggleClass('collapsed');
  });

  $(document).on('keydown', function(e) {
    var isCollaboratorsModalOpen = collaboratorsStore.isOpen();
    var isCopyModalOpen = storyCopierStore.getCurrentOpenState();
    var isShareAndEmbedModalOpen = shareAndEmbedStore.isOpen();

    if (e.ctrlKey && e.keyCode === 188) { // ',' because it's settings
      settingsPanel.trigger('sidebar:toggle');
    }

    if (e.keyCode === 27) { // esc
      if (!isCollaboratorsModalOpen && !isCopyModalOpen && !isShareAndEmbedModalOpen) {
        settingsPanel.trigger('sidebar:close');
      }
    }
  });

  storyTitleInputBox.add(storyDescriptionTextarea).on('input', updateSaveButtonEnabledState);
  storyStore.addChangeListener(updateSaveButtonEnabledState);
  coreSavingStore.addChangeListener(updateSaveButtonEnabledState);

  coreSavingStore.addChangeListener(function() {
    var saveInProgress = coreSavingStore.isSaveInProgress();
    var hasError = coreSavingStore.lastRequestSaveErrorForStory(Environment.STORY_UID) !== null;

    var doneAndNoErrorOutstanding = !saveInProgress && !hasError;

    if (saveWasInProgress && doneAndNoErrorOutstanding) {
      settingsPanel.trigger('sidebar:close');
    }

    saveWasInProgress = saveInProgress;
  });

  settingsPanel.
    on('sidebar:open', function() {
      settingsPanel.find('button[data-panel-toggle="settings-panel"]').eq(0).focus();
      toggleButton.addClass('active');
      settingsContainer.addClass('active');
      loadCurrentMetadata();
    }).
    on('sidebar:close', function() {
      var hasError = coreSavingStore.lastRequestSaveErrorForStory(Environment.STORY_UID) !== null;

      settingsContainer.removeClass('active');

      toggleButton.
        removeClass('active').
        blur();

      // If save failed, revert title and description to values present at panel open time.
      if (hasError) {
        if (isTitleChanged()) {
          dispatcher.dispatch({
            action: Actions.STORY_SET_TITLE,
            storyUid: Environment.STORY_UID,
            title: metadataStateAtPanelOpenTime.title
          });
        }

        if (isDescriptionChanged()) {
          dispatcher.dispatch({
            action: Actions.STORY_SET_DESCRIPTION,
            storyUid: Environment.STORY_UID,
            description: metadataStateAtPanelOpenTime.description
          });
        }
      }
    }).
    on('submit', 'form', function() {
      try {
        saveMetadata();
      } catch (error) {
        // We can't rethrow the error otherwise the form will submit and
        // refresh the page. That could be confusing for our users.
        console.error(error);
      } finally {
        return false;
      }
    }).
    on('click', '.settings-save-btn', saveMetadata).
    on('click', '[data-action]', dispatchActions);

  return this;
}
