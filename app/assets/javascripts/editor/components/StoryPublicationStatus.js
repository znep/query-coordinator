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
      var storyIsDirty = storyteller.storySaveStatusStore.isStoryDirty();
      var havePublishedAndDraftDiverged;
      var translationKey;

      if (permissions && permissions.isPublic) {
        havePublishedAndDraftDiverged = _havePublishedAndDraftDiverged();

        if (storyIsDirty || havePublishedAndDraftDiverged) {
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


