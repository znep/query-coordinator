import {__RewireAPI__ as StoreAPI} from '../../../app/assets/javascripts/editor/stores/Store';
import Actions from '../../../app/assets/javascripts/editor/Actions';
import Dispatcher from '../../../app/assets/javascripts/editor/Dispatcher';
import FileUploadStore from '../../../app/assets/javascripts/editor/stores/FileUploadStore';

describe('FileUploadStore', function() {

  var dispatcher;
  var fileUploadStore;

  beforeEach(function() {
    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);
    fileUploadStore = new FileUploadStore();
  });

  describe('file upload progress accessors', function() {
    describe('when in an unintialized state', function() {
      describe('.getFileUploadProgress()', function() {
        it('returns null', function() {
          assert.equal(fileUploadStore.getFileUploadProgress(), null);
        });
      });
    });

    describe('after a `FILE_UPLOAD_PROGRESS` action', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_PROGRESS,
          percentLoaded: 0.5
        });
      });

      describe('.getFileUploadProgress()', function() {
        it('returns the percentLoaded', function() {
          assert.equal(fileUploadStore.getFileUploadProgress(), 0.5);
        });
      });
    });

    describe('after a `FILE_UPLOAD_DONE` action', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_PROGRESS,
          percentLoaded: 0.5
        });
        dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_DONE
        });
      });

      describe('.getFileUploadProgress()', function() {
        it('returns null', function() {
          assert.equal(fileUploadStore.getFileUploadProgress(), null);
        });
      });
    });
  });
});
