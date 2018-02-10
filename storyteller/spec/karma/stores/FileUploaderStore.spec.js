import sinon from 'sinon';
import { assert } from 'chai';

import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import I18n from 'editor/I18n';
import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import FileUploaderStore, {__RewireAPI__ as FileUploaderStoreAPI, STATUS} from 'editor/stores/FileUploaderStore';

describe('FileUploaderStore', function() {
  var dispatcher;
  var fileUploaderStore;
  var exceptionNotifierMock;

  var getContentTypeJSON = _.constant({'Content-Type': 'application/json'});
  var getSignedUploadPayload = _.constant(JSON.stringify({ upload: { content_type: 'text/html', url: 'http://hello.com' } }));
  var getUploadPayload = _.constant(JSON.stringify({}));
  var getSaveResourcePayload = _.constant(JSON.stringify({document: {id: 1}}));

  function validBlob() {
    var blob = new Blob(['<h1>Hello</h1>'], {type: 'text/html'});

    blob.name = 'yes';

    return blob;
  }

  beforeEach(function() {
    dispatcher = new Dispatcher();
    StoreAPI.__Rewire__('dispatcher', dispatcher);

    exceptionNotifierMock = {notify: sinon.stub()};
    FileUploaderStoreAPI.__Rewire__('exceptionNotifier', exceptionNotifierMock);

    fileUploaderStore = new FileUploaderStore();
  });

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
    exceptionNotifierMock.notify.reset();
  });

  describe('when reading from the store', function() {
    describe('fileExistsById', function() {
      describe('when a file exists', function() {
        beforeEach(function() {
          dispatcher.dispatch({
            action: Actions.FILE_UPLOAD,
            id: 1,
            file: validBlob()
          });
        });

        it('returns true', function() {
          assert.isTrue(fileUploaderStore.fileExistsById(1));
        });
      });

      describe('when a file doesn\'t exist', function() {
        it('returns false', function() {
          assert.isFalse(fileUploaderStore.fileExistsById(2));
        });
      });
    });

    describe('fileById', function() {
      describe('when the file exists', function() {
        beforeEach(function() {
          dispatcher.dispatch({
            action: Actions.FILE_UPLOAD,
            id: 1,
            file: validBlob()
          });
        });

        it('returns a copy of the file', function() {
          assert.isObject(fileUploaderStore.fileById(1));
        });
      });

      describe('when the file doesn\'t exist', function() {
        it('returns null', function() {
          assert.isNull(fileUploaderStore.fileById(2));
        });
      });
    });

    describe('files', function() {
      describe('when there are no files', function() {
        it('returns an empty Object', function() {
          assert.isObject(fileUploaderStore.files());
          assert.lengthOf(Object.keys(fileUploaderStore.files()), 0);
        });
      });

      describe('when there are files', function() {
        beforeEach(function() {
          dispatcher.dispatch({
            action: Actions.FILE_UPLOAD,
            id: 1,
            file: validBlob()
          });
        });

        it('returns a copy of an Object with file Objects', function() {
          assert.isObject(fileUploaderStore.files());
          assert.lengthOf(Object.keys(fileUploaderStore.files()), 1);
        });
      });
    });

    describe('filesByStatus', function() {
      describe('when there are files with the status', function() {
        beforeEach(function() {
          dispatcher.dispatch({
            action: Actions.FILE_UPLOAD,
            id: 1,
            file: validBlob()
          });
        });

        it('returns a copy of an Array of file objects', function() {
          var files = fileUploaderStore.filesByStatus(STATUS.ACKNOWLEDGED);
          assert.isArray(files);
          assert.lengthOf(files, 1);
        });
      });

      describe('when there aren\'t files with the status', function() {
        it('returns an empty Array', function() {
          var files = fileUploaderStore.filesByStatus(STATUS.COMPLETED);
          assert.isArray(files);
          assert.lengthOf(files, 0);
        });
      });
    });
  });

  describe('when uploading', function() {
    describe('when provided incorrect payloads', function() {
      describe('when the payload doesn\'t contain a File or Blob', function() {
        it('throws', function() {
          assert.throws(function() {
            dispatcher.dispatch({
              action: Actions.FILE_UPLOAD,
              id: 1,
              file: null
            });
          });
        });
      });

      describe('when the file doesn\'t have a name', function() {
        it('throws', function() {
          assert.throws(function() {
            dispatcher.dispatch({
              action: Actions.FILE_UPLOAD,
              id: 1,
              file: new Blob()
            });
          });
        });
      });

      describe('when the file doesn\'t have a size', function() {
        it('throws', function() {
          assert.throws(function() {
            var blob = new Blob();
            blob.name = 'yes';
            delete blob.size;

            dispatcher.dispatch({
              action: Actions.FILE_UPLOAD,
              id: 1,
              file: blob
            });
          });
        });
      });

      describe('when the file doesn\'t have a type', function() {
        it('throws', function() {
          assert.throws(function() {
            var blob = new Blob();
            blob.name = 'yes';
            blob.size = 120302;
            delete blob.type;

            dispatcher.dispatch({
              action: Actions.FILE_UPLOAD,
              id: 1,
              file: blob
            });
          });
        });
      });
    });

    describe('when working through the file upload workflow', function() {
      var server;

      function behavesLikeAnExceptionHandler() {
        it('changes file status', function(done) {
          _.delay(function() {
            try {
              assert.propertyVal(fileUploaderStore.fileById(1), 'status', STATUS.ERRORED);
            } catch (e) {
              done(e);
            }
            done();
          }, 100);
        });
      }

      beforeEach(function() {
        server = sinon.fakeServer.create();

        dispatcher.dispatch({
          action: Actions.FILE_UPLOAD,
          id: 1,
          file: validBlob()
        });
      });

      afterEach(function() {
        server.restore();
      });

      describe('when getSignedUpload fails', function() {
        beforeEach(function() {
          server.requests[0].respond(400, getContentTypeJSON(), '{}');
        });

        behavesLikeAnExceptionHandler();
      });

      describe('when upload fails', function() {
        beforeEach(function(done) {
          server.requests[0].respond(200, getContentTypeJSON(), getSignedUploadPayload());

          _.delay(function() {
            server.requests[1].respond(400, getContentTypeJSON(), '');
            done();
          }, 10);
        });

        behavesLikeAnExceptionHandler();
      });

      describe('when saveResource fails', function() {
        beforeEach(function(done) {
          server.requests[0].respond(200, getContentTypeJSON(), getSignedUploadPayload());
          _.delay(function() {
            server.requests[1].respond(200, getContentTypeJSON(), getUploadPayload());
            _.delay(function() {
              server.requests[2].respond(400, getContentTypeJSON(), '{}');
              done();
            }, 10);
          }, 10);
        });

        behavesLikeAnExceptionHandler();
      });

      describe('when waitForResource fails', function() {
        beforeEach(function(done) {
          server.requests[0].respond(200, getContentTypeJSON(), getSignedUploadPayload());
          _.delay(function() {
            server.requests[1].respond(200, getContentTypeJSON(), getUploadPayload());
            _.delay(function() {
              server.requests[2].respond(200, getContentTypeJSON(), getSaveResourcePayload());
              _.delay(function() {
                server.requests[3].respond(400, getContentTypeJSON(), '{}');
                done();
              }, 10);
            }, 10);
          }, 10);
        });

        behavesLikeAnExceptionHandler();
      });

      describe('when it succeeds', function() {
        beforeEach(function(done) {
          server.requests[0].respond(200, getContentTypeJSON(), getSignedUploadPayload());
          _.delay(function() {
            server.requests[1].respond(200, getContentTypeJSON(), getUploadPayload());
            _.delay(function() {
              server.requests[2].respond(200, getContentTypeJSON(), getSaveResourcePayload());
              _.delay(function() {
                server.requests[3].respond(200, getContentTypeJSON(), JSON.stringify({document: {status: 'processed'}}));
                done();
              }, 10);
            }, 10);
          }, 10);
        });

        it('updates the file\'s status to COMPLETED', function(done) {
          _.defer(function() {
            var files = fileUploaderStore.files();

            assert.lengthOf(Object.keys(files), 1);
            assert.propertyVal(fileUploaderStore.fileById(1), 'status', STATUS.COMPLETED);

            done();
          });
        });
      });

      describe('when cancelling', function() {
        beforeEach(function(done) {
          server.requests[0].respond(200, getContentTypeJSON(), getSignedUploadPayload());
          _.delay(function() {
            dispatcher.dispatch({
              action: Actions.FILE_CANCEL,
              id: 1
            });

            _.defer(function() {
              server.requests[1].respond(200, getContentTypeJSON(), getUploadPayload());
              done();
            });
          });
        });

        it('updates the file\'s status to CANCELLED', function(done) {
          _.defer(function() {
            var files = fileUploaderStore.files();

            assert.lengthOf(Object.keys(files), 1);
            assert.propertyVal(fileUploaderStore.fileById(1), 'status', STATUS.ERRORED);
            assert.propertyVal(fileUploaderStore.fileById(1), 'message', I18n.t('editor.asset_selector.image_upload.errors.cancelled'));

            done();
          });
        });
      });
    });
  });
});
