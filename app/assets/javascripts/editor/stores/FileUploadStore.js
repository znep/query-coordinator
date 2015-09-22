(function(root) {
  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function FileUploadStore() {
    _.extend(this, new storyteller.Store());

    var _fileUploadProgress = null;

    var self = this;

    this.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Actions.FILE_UPLOAD_PROGRESS:
        case Actions.EMBED_CODE_UPLOAD_PROGRESS:
          utils.assertHasProperty(payload, 'percentLoaded');
          _setFileUploadProgress(payload.percentLoaded);
          break;

        case Actions.FILE_UPLOAD_DONE:
        case Actions.EMBED_CODE_UPLOAD_DONE:
          _setFileUploadProgress(null);
          break;
      }
    });

    /**
     * Public Methods
     */

    this.getFileUploadProgress = function() {
      return _fileUploadProgress;
    };


    /**
     * Private methods
     */

    function _setFileUploadProgress(progressPercent) {
      if (_fileUploadProgress !== progressPercent) {
        _fileUploadProgress = progressPercent;
        self._emitChange();
      }
    }
  }

  root.socrata.storyteller.FileUploadStore = FileUploadStore;
})(window);
