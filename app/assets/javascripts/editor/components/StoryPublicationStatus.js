/*
 * A component that renders a story title.
 */
(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;

  $.fn.storyPublicationStatus = function(storyUid) {
    var $this = $(this);

    function render() {
      var permissions = storyteller.storyStore.getStoryPermissions(storyUid);
      var havePublishedAndDraftDiverged;
      var storyIsClean;
      var translationKey;

      if (permissions && permissions.isPublic && storyIsClean) {
        storyIsClean = !storyteller.storySaveStatusStore.isStoryDirty();
        havePublishedAndDraftDiverged = _havePublishedAndDraftDiverged();

        if (storyIsClean || havePublishedAndDraftDiverged) {
          translationKey = 'status.draft';
        } else {
          translationKey = 'status.published';
        }
      } else {
        translationKey = 'status.draft';
      }

      $this.text(I18n.t('editor.settings_panel.publishing_section.{0}'.format(translationKey)));
    }

    function _havePublishedAndDraftDiverged() {
      var publishedStory = storyteller.storyStore.getStoryPublishedStory(storyUid) || root.publishedStory;
      var digest = storyteller.storyStore.getStoryDigest(storyUid);

      return publishedStory.digest !== digest;
    }

    storyteller.storySaveStatusStore.addChangeListener(render);
    storyteller.storyStore.addChangeListener(render);
    render();

    return this;
  };

}(jQuery, window));


