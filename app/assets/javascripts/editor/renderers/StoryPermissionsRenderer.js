import $ from 'jQuery';
import _ from 'lodash';

import I18n from '../I18n';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { storyStore } from '../stores/StoryStore';
import { storySaveStatusStore } from '../stores/StorySaveStatusStore';
import { storyPermissionsManager } from '../StoryPermissionsManager';

export default function StoryPermissionsRenderer() {
  var _$settingsPanelStoryStatus;
  var _$visibilityLabel;
  var _$visibilityButton;
  var _$visibilityButtonText;
  var _$updatePublicLabel;
  var _$updatePublicButton;
  var _$publishingHelpText;
  var _$errorContainer;

  var _$settingsPanelPublishing = $('.settings-panel-publishing');

  StorytellerUtils.assert(storySaveStatusStore, 'storySaveStatusStore must be instantiated');
  StorytellerUtils.assert(_$settingsPanelPublishing.length === 1, 'Cannot find a publishing section in settings panel.');

  _$settingsPanelStoryStatus = _$settingsPanelPublishing.find('.settings-panel-story-status');

  _$visibilityLabel = _$settingsPanelPublishing.find('.settings-panel-story-visibility h3');
  _$visibilityButton = _$settingsPanelPublishing.find('.settings-panel-story-visibility button');
  _$visibilityButtonText = _$visibilityButton.find('span');

  _$updatePublicLabel = _$settingsPanelPublishing.find('.settings-panel-story-status h3');
  _$updatePublicButton = _$settingsPanelPublishing.find('.settings-panel-story-status button');

  _$publishingHelpText = _$settingsPanelPublishing.find('.settings-panel-story-publishing-help-text');

  _$errorContainer = $('.settings-panel .settings-panel-errors');

  _attachEvents();
  _render();

  function _attachEvents() {
    storyStore.addChangeListener(_render);
    storySaveStatusStore.addChangeListener(_render);

    _$visibilityButton.click(function() {
      var isPublic = storyPermissionsManager.isPublic();

      if (isPublic) {
        storyPermissionsManager.makePrivate(_renderError);
      } else {
        storyPermissionsManager.makePublic(_renderError);
      }

      _$errorContainer.addClass('hidden');
      _$visibilityButton.addClass('btn-busy');
    });

    _$updatePublicButton.click(function() {
      var isPublic = storyPermissionsManager.isPublic();

      if (isPublic) {
        storyPermissionsManager.makePublic(_renderError);
      } else {
        _renderError(I18n.t('editor.settings_panel.publishing_section.errors.not_published_not_updated'));
      }

      _$errorContainer.addClass('hidden');
      _$updatePublicButton.addClass('btn-busy');
    });
  }

  function _renderError() {
    _$errorContainer.removeClass('hidden');
    _$visibilityButton.removeClass('btn-busy');
    _$updatePublicButton.removeClass('btn-busy');
  }

  function _render() {
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

      _$visibilityLabel.text(i18n('visibility.public'));
      _$visibilityButtonText.text(i18n('visibility.make_story_private'));
      _$visibilityButton.addClass('btn-default').removeClass('btn-alternate-2');
      _$updatePublicButton.prop('disabled', true);
      _$updatePublicLabel.text(i18n('status.published'));
      _$publishingHelpText.text(i18n('messages.has_been_published'));

      if (havePublishedAndDraftDiverged && canManagePublicVersion && isNotContributor) {
        _$updatePublicButton.prop('disabled', false);
        _$publishingHelpText.text(i18n('messages.previously_published'));
        _$updatePublicLabel.text(i18n('status.draft'));
      }
    } else {
      _$visibilityLabel.text(i18n('visibility.private'));
      _$visibilityButtonText.text(i18n('visibility.make_story_public'));
      _$visibilityButton.removeClass('btn-default').addClass('btn-alternate-2');
      _$updatePublicButton.prop('disabled', true);
      _$publishingHelpText.text(i18n('messages.can_be_shared_publicly'));
    }

    _$settingsPanelStoryStatus.toggleClass('hidden', !isPublic);
    _$errorContainer.addClass('hidden');
    _$visibilityButton.removeClass('btn-busy');
    _$updatePublicButton.removeClass('btn-busy');
  }
}
