describe('FileUploadStore', function() {
  'use strict';

  var storyteller = window.socrata.storyteller;

  describe('file upload progress accessors', function() {
    describe('when in an unintialized state', function() {
      describe('.getFileUploadProgress()', function() {
        it('returns null', function() {
          assert.equal(storyteller.fileUploadStore.getFileUploadProgress(), null);
        });
      });
    });

    describe('after a `FILE_UPLOAD_PROGRESS` action', function() {
      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_PROGRESS,
          percentLoaded: 0.5
        });
      });

      describe('.getFileUploadProgress()', function() {
        it('returns the percentLoaded', function() {
          assert.equal(storyteller.fileUploadStore.getFileUploadProgress(), 0.5);
        });
      });
    });

    describe('after a `FILE_UPLOAD_DONE` action', function() {
      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_PROGRESS,
          percentLoaded: 0.5
        });
        storyteller.dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_DONE
        });
      });

      describe('.getFileUploadProgress()', function() {
        it('returns null', function() {
          assert.equal(storyteller.fileUploadStore.getFileUploadProgress(), null);
        });
      });
    });
  });
});
