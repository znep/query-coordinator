/**
 * A component that renders the settingsPanel.
 * You may trigger these events to control the sidebar:
 *
 * 'sidebar:open'
 * 'sidebar:close'
 * 'sidebar:toggle'
 */
(function($, root) {
  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

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

  $.fn.settingsPanel = function(toggleButton) {
    if (!$.fn.isPrototypeOf(toggleButton)) {
      throw new Error('toggleButton must be a jQuery instance');
    }

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

    var storyPermissionsRenderer = new storyteller.StoryPermissionsRenderer(); //eslint-disable-line no-unused-vars

    storyteller.coreSavingStore.addChangeListener(function() {
      var saveInProgress = storyteller.coreSavingStore.isSaveInProgress();
      var lastSaveError = storyteller.coreSavingStore.lastRequestSaveErrorForStory(
        storyteller.userStoryUid
      );

      saveButton.toggleClass('busy', saveInProgress);

      saveErrorMessage.toggleClass('active', lastSaveError !== null);
      saveErrorMessageDetails.text(lastSaveError);
    });

    function loadCurrentMetadata() {
      metadataStateAtPanelOpenTime = {
        title: storyteller.storyStore.getStoryTitle(storyteller.userStoryUid),
        description: storyteller.storyStore.getStoryDescription(storyteller.userStoryUid)
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
      hasError = storyteller.
        coreSavingStore.
        lastRequestSaveErrorForStory(storyteller.userStoryUid) !== null;

      saveButton.attr(
        'disabled',
        !hasChanges && !hasError
      );
    }

    function saveMetadata() {
      if (isTitleChanged()) {
        storyteller.dispatcher.dispatch({
          action: Constants.STORY_SET_TITLE,
          storyUid: storyteller.userStoryUid,
          title: storyTitleInputBox.val()
        });
      }

      if (isDescriptionChanged()) {
        storyteller.dispatcher.dispatch({
          action: Constants.STORY_SET_DESCRIPTION,
          storyUid: storyteller.userStoryUid,
          description: storyDescriptionTextarea.val()
        });
      }

      storyteller.dispatcher.dispatch({
        action: Constants.STORY_SAVE_METADATA,
        storyUid: storyteller.userStoryUid
      });
    }

    // Set up some input events.

    toggleButton.on('click', function() {
      settingsPanel.trigger('sidebar:toggle');
    });

    $(document).on('keydown', function(e) {
      if (e.ctrlKey && e.keyCode === 188) { // ',' because it's settings
        settingsPanel.trigger('sidebar:toggle');
      }
      if (e.keyCode === 27) { // esc
        settingsPanel.trigger('sidebar:close');
      }
    });

    storyTitleInputBox.add(storyDescriptionTextarea).on('input', updateSaveButtonEnabledState);
    storyteller.storyStore.addChangeListener(updateSaveButtonEnabledState);
    storyteller.coreSavingStore.addChangeListener(updateSaveButtonEnabledState);

    storyteller.coreSavingStore.addChangeListener(function() {
      var saveInProgress = storyteller.coreSavingStore.isSaveInProgress();
      var hasError = storyteller.
        coreSavingStore.
        lastRequestSaveErrorForStory(storyteller.userStoryUid) !== null;

      var doneAndNoErrorOutstanding = !saveInProgress && !hasError;

      if (saveWasInProgress && doneAndNoErrorOutstanding) {
        settingsPanel.trigger('sidebar:close');
      }

      saveWasInProgress = saveInProgress;
    });

    settingsPanel.
      on('mousewheel', utils.preventScrolling).
      on('sidebar:open', function() {
        settingsPanel.find('button[data-panel-toggle="settings-panel"]').eq(0).focus();
        toggleButton.addClass('active');
        settingsContainer.addClass('active');
        loadCurrentMetadata();
      }).
      on('sidebar:close', function() {
        var hasError = storyteller.
          coreSavingStore.
          lastRequestSaveErrorForStory(storyteller.userStoryUid) !== null;

        settingsContainer.removeClass('active');

        toggleButton.
          removeClass('active').
          blur();

        // If save failed, revert title and description to values present at panel open time.
        if (hasError) {
          if (isTitleChanged()) {
            storyteller.dispatcher.dispatch({
              action: Constants.STORY_SET_TITLE,
              storyUid: storyteller.userStoryUid,
              title: metadataStateAtPanelOpenTime.title
            });
          }

          if (isDescriptionChanged()) {
            storyteller.dispatcher.dispatch({
              action: Constants.STORY_SET_DESCRIPTION,
              storyUid: storyteller.userStoryUid,
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
      on('click', '.settings-save-btn', saveMetadata);

    return this;
  };
}(jQuery, window));
