(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  // var utils = socrata.utils;

  function FileStore() {
    _.extend(this, new storyteller.Store());

    // var self = this;

    // this.register(function(payload) {

    //   var action = payload.action;

    //   switch (action) {

    //     case Constants.STORY_SAVE_METADATA:
    //       utils.assertHasProperty(payload, 'storyUid');
    //       _saveStoryMetadata(payload.storyUid);
    //       break;
    //   }
    // });


  }

  root.socrata.storyteller.FileStore = FileStore;

})(window);
