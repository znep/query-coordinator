/*
 * A component that renders the publication status of a story.
 */
(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;

  $.fn.storyPublicationStatus = function(storyUid) {
    var $this = $(this);

    function render() {
      var permissions = storyteller.storyStore.getStoryPermissions(storyUid);
      var storyIsDirty = storyteller.storySaveStatusStore.isStoryDirty();
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
        storyteller.storyStore.getStoryPublishedStory(storyUid) ||
        root.publishedStory;
      var digest = storyteller.storyStore.getStoryDigest(storyUid);
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

    storyteller.storySaveStatusStore.addChangeListener(render);
    storyteller.storyStore.addChangeListener(render);
    render();

    return this;
  };

}(jQuery, window));


