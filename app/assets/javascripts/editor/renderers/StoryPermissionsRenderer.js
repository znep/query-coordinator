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
			var permissions = storyStore.getStoryPermissions(Environment.STORY_UID);
			StorytellerUtils.assert(permissions, 'Permissions object must be available');

			if (permissions.isPublic) {
				storyPermissionsManager.makePrivate(_renderError);
			} else {
				storyPermissionsManager.makePublic(_renderError);
			}

			_$errorContainer.addClass('hidden');
			_$visibilityButton.addClass('btn-busy');
		});

		_$updatePublicButton.click(function() {
			var permissions = storyStore.getStoryPermissions(Environment.STORY_UID);
			StorytellerUtils.assert(permissions, 'Permissions object must be available');

			if (permissions.isPublic) {
				storyPermissionsManager.makePublic(_renderError);
			} else {
				_renderError(I18n.t('editor.settings_panel.publishing_section.errors.not_published_not_updated'));
			}

			_$errorContainer.addClass('hidden');
			_$updatePublicButton.addClass('btn-busy');
		});
	}

	function _havePublishedAndDraftDiverged() {
		var publishedStory = storyStore.getStoryPublishedStory(Environment.STORY_UID) || Environment.PUBLISHED_STORY_DATA;
		var digest = storyStore.getStoryDigest(Environment.STORY_UID);
		var publishedAndDraftDiverged = false;

		// Only stories that have been published can have their published and
		// draft versions diverge. If a story has never been published, storyStore
		// will return undefined for .getStoryPublishedStory() and the
		// publishedStory object embedded in the page by the Rails app will be set
		// to null. Because of the '|| root.publishedStory;' conditional
		// assignment to publishedStory above, we can be reasonably confident that
		// we will only ever encounter a JSON representation of the published
		// story or null.
		if (publishedStory !== null && publishedStory.hasOwnProperty('digest')) {
			publishedAndDraftDiverged = publishedStory.digest !== digest;
		}

		return publishedAndDraftDiverged;
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
		var permissions = storyStore.getStoryPermissions(Environment.STORY_UID);
		var i18n = function(key) {
			return I18n.t(
        StorytellerUtils.format('editor.settings_panel.publishing_section.{0}', key)
      );
		};

		if (permissions && permissions.isPublic) {
			havePublishedAndDraftDiverged = _havePublishedAndDraftDiverged();

			_$visibilityLabel.text(i18n('visibility.public'));
			_$visibilityButtonText.text(i18n('visibility.make_story_private'));
			_$visibilityButton.addClass('btn-default').removeClass('btn-secondary');
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
			_$visibilityButton.removeClass('btn-default').addClass('btn-secondary');
			_$updatePublicButton.prop('disabled', true);
			_$publishingHelpText.text(i18n('messages.can_be_shared_publicly'));
		}

		_$settingsPanelStoryStatus.toggleClass('hidden', !permissions || !permissions.isPublic);
		_$errorContainer.addClass('hidden');
		_$visibilityButton.removeClass('btn-busy');
		_$updatePublicButton.removeClass('btn-busy');
	}
}
