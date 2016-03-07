import $ from 'jQuery';

import I18n from '../I18n';
import Environment from '../../StorytellerEnvironment';
import { storyStore } from '../stores/StoryStore';
import { storySaveStatusStore } from '../stores/StorySaveStatusStore';

$.fn.storyPublicationStatus = StoryPublicationStatus;

export default function StoryPublicationStatus(storyUid) {
  var $this = $(this);

  function render() {
    var permissions = storyStore.getStoryPermissions(storyUid);
    var storyIsDirty = storySaveStatusStore.isStoryDirty();
    var publishedAndDraftDiverged;
    var translationKey;

    if (permissions && permissions.isPublic) {
      publishedAndDraftDiverged = _havePublishedAndDraftDiverged();

      if (storyIsDirty || publishedAndDraftDiverged) {
        translationKey = 'status.draft';
      } else {
        translationKey = 'status.published';
      }
    } else {
      translationKey = 'status.draft';
    }

    $this.text(
      I18n.t('editor.settings_panel.publishing_section.{0}'.
        format(translationKey)
      )
    );
  }

  function _havePublishedAndDraftDiverged() {
    var publishedStory =
      storyStore.getStoryPublishedStory(storyUid) ||
      Environment.PUBLISHED_STORY_DATA;
    var digest = storyStore.getStoryDigest(storyUid);
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

  storySaveStatusStore.addChangeListener(render);
  storyStore.addChangeListener(render);
  render();

  return this;
}
