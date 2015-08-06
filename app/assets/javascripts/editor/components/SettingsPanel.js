/**
 * A component that renders the settingsPanel.
 * You may trigger these events to control the sidebar:
 *
 * 'sidebar:open'
 * 'sidebar:close'
 * 'sidebar:toggle'
 */
;(function($, socrata) {
  'use strict'

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
      storyTitleInputBox.val(
        storyteller.storyStore.getStoryTitle(storyteller.userStoryUid)
      );
      storyDescriptionTextarea.val(
        storyteller.storyStore.getStoryDescription(storyteller.userStoryUid)
      );
      updateSaveButtonEnabledState();
    }

    function isTitleChanged() {
      var titleInStore = storyteller.storyStore.getStoryTitle(storyteller.userStoryUid);
      var titleInBox = storyTitleInputBox.val();

      return titleInStore !== titleInBox;
    }

    function isDescriptionChanged() {
      var descriptionInStore = storyteller.storyStore.getStoryDescription(storyteller.userStoryUid);
      var descriptionInBox = storyDescriptionTextarea.val();

      return descriptionInStore !== descriptionInBox;
    }

    function updateSaveButtonEnabledState() {
      var hasChanges = isTitleChanged() || isDescriptionChanged();
      var hasError = storyteller.
        coreSavingStore.
        lastRequestSaveErrorForStory(storyteller.userStoryUid) !== null;

      saveButton.attr(
        'disabled',
        !hasChanges && !hasError
      );
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
      var doneAndNoErrorOutstanding =
        !storyteller.coreSavingStore.isSaveInProgress() &&
        storyteller.coreSavingStore.lastRequestSaveErrorForStory(storyteller.userStoryUid) === null;

      var lastRenderedAsBusy = saveButton.prop('disabled');

      if (lastRenderedAsBusy && doneAndNoErrorOutstanding) {
        settingsPanel.trigger('sidebar:close');
      }
    });

    settingsPanel.
      on('sidebar:open', function() {
        toggleButton.addClass('active');
        settingsContainer.addClass('active');
        settingsPanel.find('a').eq(0).focus();
        loadCurrentMetadata();
      }).
      on('sidebar:close', function() {
        toggleButton.removeClass('active');
        settingsContainer.removeClass('active');
        $('header a').eq(0).focus(); // put focus back in the header
      }).
      on('mousewheel', '.scrollable', utils.preventScrolling).
      on('click', '.settings-save-btn', function() {
        if (isTitleChanged()) {
          storyteller.dispatcher.dispatch({
            action: Constants.STORY_SET_TITLE,
            storyUid: storyteller.userStoryUid,
            title: storyTitleInputBox.val()
          });
        };

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
      });

    return this;
  };
}(jQuery, window.socrata));
