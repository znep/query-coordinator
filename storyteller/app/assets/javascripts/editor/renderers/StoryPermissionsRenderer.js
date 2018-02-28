import $ from 'jquery';

import I18n from '../I18n';
import Environment from '../../StorytellerEnvironment';
import { assert } from 'common/js_utils';
import { assetWillEnterApprovalsQueueWhenMadePublic } from 'common/asset/utils';
import { storyStore } from '../stores/StoryStore';
import { storySaveStatusStore } from '../stores/StorySaveStatusStore';
import { permissionStore } from '../stores/PermissionStore';
import { storyPermissionsManager } from '../StoryPermissionsManager';

const { CORE_VIEW, STORY_UID, IS_GOAL } = Environment;

function i18n(key) {
  if (IS_GOAL) {
    key += '_goals';
  }
  return I18n.t(`editor.settings_panel.publishing_section.${key}`);
}

export default function StoryPermissionsRenderer() {
  var $settingsPanelStoryStatus;
  var $visibilityLabel;
  var $visibilityButton;
  var $visibilityButtonText;
  var $approvalMessageText;
  var $updatePublicLabel;
  var $updatePublicButton;
  var $publishingHelpText;
  var $errorContainer;

  var $settingsPanelPublishing = $('.settings-panel-publishing');

  assert(storySaveStatusStore, 'storySaveStatusStore must be instantiated');
  assert($settingsPanelPublishing.length === 1, 'Cannot find a publishing section in settings panel.');

  $settingsPanelStoryStatus = $settingsPanelPublishing.find('.settings-panel-story-status');

  $visibilityLabel = $settingsPanelPublishing.find('.settings-panel-story-visibility h3');
  $visibilityButton = $settingsPanelPublishing.find('.settings-panel-story-visibility button');
  $visibilityButtonText = $visibilityButton.find('span');
  $approvalMessageText = $settingsPanelPublishing.find('.approval-message');

  $updatePublicLabel = $settingsPanelPublishing.find('.settings-panel-story-status h3');
  $updatePublicButton = $settingsPanelPublishing.find('.settings-panel-story-status button');

  $publishingHelpText = $settingsPanelPublishing.find('.settings-panel-story-publishing-help-text');

  $errorContainer = $('.settings-panel .settings-panel-errors');

  attachEvents();
  render();

  function attachEvents() {
    storyStore.addChangeListener(render);
    storySaveStatusStore.addChangeListener(render);

    $visibilityButton.click(function() {
      var isPublic = storyStore.isStoryPublic(STORY_UID);

      if (isPublic) {
        storyPermissionsManager.makePrivate(renderError);
      } else {
        storyPermissionsManager.makePublic(renderError);
      }

      $errorContainer.addClass('hidden');
      $visibilityButton.addClass('btn-busy');
    });

    $updatePublicButton.click(function() {
      var isPublic = storyStore.isStoryPublic(STORY_UID);

      if (isPublic) {
        storyPermissionsManager.makePublic(renderError);
      } else {
        renderError(i18n('errors.not_published_not_updated'));
      }

      $errorContainer.addClass('hidden');
      $updatePublicButton.addClass('btn-busy');
    });
  }

  function renderError() {
    $errorContainer.removeClass('hidden');
    $visibilityButton.removeClass('btn-busy');
    $updatePublicButton.removeClass('btn-busy');
  }

  function render() {
    if (!storyStore.doesStoryExist(STORY_UID)) {
      return null; // Story not loaded yet.
    }

    const isPublic = storyStore.isStoryPublic(STORY_UID);
    const isDraftUnpublished = storyStore.isDraftUnpublished(STORY_UID);

    if (isPublic) {
      $visibilityLabel.text(i18n('visibility.public'));
      $visibilityButtonText.text(i18n('visibility.make_story_private'));
      $visibilityButton.addClass('btn-default').removeClass('btn-alternate-2');

      if (isDraftUnpublished && permissionStore.canPublishCurrentStory()) {
        $updatePublicButton.prop('disabled', false);
        $updatePublicLabel.text(i18n('status.draft'));
        $publishingHelpText.text(i18n('messages.previously_published'));
      } else {
        $updatePublicButton.prop('disabled', true);
        $updatePublicLabel.text(i18n('status.published'));
        $publishingHelpText.text(i18n('messages.has_been_published'));
      }
    } else {
      $visibilityLabel.text(i18n('visibility.private'));
      $visibilityButtonText.text(i18n('visibility.make_story_public'));
      $visibilityButton.removeClass('btn-default').addClass('btn-alternate-2');

      $updatePublicButton.prop('disabled', true);
      $publishingHelpText.text(i18n('messages.can_be_shared_publicly'));

      assetWillEnterApprovalsQueueWhenMadePublic({ coreView: CORE_VIEW }).then(function(requiresApproval) {
        if (requiresApproval) {
          $approvalMessageText.removeClass('hidden');
        }
      });
    }

    $settingsPanelStoryStatus.toggleClass('hidden', !isPublic);
    $errorContainer.addClass('hidden');
    $visibilityButton.removeClass('btn-busy');
    $updatePublicButton.removeClass('btn-busy');
  }
}
