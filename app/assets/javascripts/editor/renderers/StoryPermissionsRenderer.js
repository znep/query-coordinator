import $ from 'jQuery';
import _ from 'lodash';

import I18n from '../I18n';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { storyStore } from '../stores/StoryStore';
import { storySaveStatusStore } from '../stores/StorySaveStatusStore';
import { storyPermissionsManager } from '../StoryPermissionsManager';

export default function StoryPermissionsRenderer() {
  var $settingsPanelStoryStatus;
  var $visibilityLabel;
  var $visibilityButton;
  var $visibilityButtonText;
  var $updatePublicLabel;
  var $updatePublicButton;
  var $publishingHelpText;
  var $errorContainer;

  var $settingsPanelPublishing = $('.settings-panel-publishing');

  StorytellerUtils.assert(storySaveStatusStore, 'storySaveStatusStore must be instantiated');
  StorytellerUtils.assert($settingsPanelPublishing.length === 1, 'Cannot find a publishing section in settings panel.');

  $settingsPanelStoryStatus = $settingsPanelPublishing.find('.settings-panel-story-status');

  $visibilityLabel = $settingsPanelPublishing.find('.settings-panel-story-visibility h3');
  $visibilityButton = $settingsPanelPublishing.find('.settings-panel-story-visibility button');
  $visibilityButtonText = $visibilityButton.find('span');

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
      var isPublic = storyPermissionsManager.isPublic();

      if (isPublic) {
        storyPermissionsManager.makePrivate(renderError);
      } else {
        storyPermissionsManager.makePublic(renderError);
      }

      $errorContainer.addClass('hidden');
      $visibilityButton.addClass('btn-busy');
    });

    $updatePublicButton.click(function() {
      var isPublic = storyPermissionsManager.isPublic();

      if (isPublic) {
        storyPermissionsManager.makePublic(renderError);
      } else {
        renderError(I18n.t('editor.settings_panel.publishing_section.errors.not_published_not_updated'));
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
    if (!storyStore.storyExists(Environment.STORY_UID)) {
      return null; // Story not loaded yet.
    }

    var havePublishedAndDraftDiverged;
    var canManagePublicVersion = _.includes(Environment.CURRENT_USER_STORY_AUTHORIZATION.domainRights, 'manage_story_public_version');
    var isNotContributor = Environment.CURRENT_USER_STORY_AUTHORIZATION.viewRole !== 'contributor';
    var isPublic = storyPermissionsManager.isPublic();
    var i18n = function(key) {
      return I18n.t(
        StorytellerUtils.format('editor.settings_panel.publishing_section.{0}', key)
      );
    };

    if (isPublic) {
      havePublishedAndDraftDiverged = storyPermissionsManager.havePublishedAndDraftDiverged();

      $visibilityLabel.text(i18n('visibility.public'));
      $visibilityButtonText.text(i18n('visibility.make_story_private'));
      $visibilityButton.addClass('btn-default').removeClass('btn-alternate-2');
      $updatePublicButton.prop('disabled', true);
      $updatePublicLabel.text(i18n('status.published'));
      $publishingHelpText.text(i18n('messages.has_been_published'));

      if (havePublishedAndDraftDiverged && canManagePublicVersion && isNotContributor) {
        $updatePublicButton.prop('disabled', false);
        $publishingHelpText.text(i18n('messages.previously_published'));
        $updatePublicLabel.text(i18n('status.draft'));
      }
    } else {
      $visibilityLabel.text(i18n('visibility.private'));
      $visibilityButtonText.text(i18n('visibility.make_story_public'));
      $visibilityButton.removeClass('btn-default').addClass('btn-alternate-2');
      $updatePublicButton.prop('disabled', true);
      $publishingHelpText.text(i18n('messages.can_be_shared_publicly'));
    }

    $settingsPanelStoryStatus.toggleClass('hidden', !isPublic);
    $errorContainer.addClass('hidden');
    $visibilityButton.removeClass('btn-busy');
    $updatePublicButton.removeClass('btn-busy');
  }
}
