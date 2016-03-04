import _ from 'lodash';

import Actions from '../../app/assets/javascripts/editor/Actions';
import StorytellerUtils from '../../app/assets/javascripts/StorytellerUtils';
import FileUploader, {__RewireAPI__ as FileUploaderAPI} from '../../app/assets/javascripts/editor/FileUploader';
import Dispatcher from '../../app/assets/javascripts/editor/Dispatcher';

describe('FileUploader', function() {

  var dispatcher;
  var dispatchedEvents;
  var server;
  var fileUploader;
  var mockFile;
  var EnvironmentMocker = {
    STORY_UID: 'four-four'
  };
  var ConstantsMocker = {
    CHECK_DOCUMENT_PROCESSED_RETRY_INTERVAL: 25,
    CHECK_DOCUMENT_PROCESSED_MAX_RETRY_SECONDS: 1,
    MAX_FILE_SIZE_BYTES: 5 * 1024
  };

  beforeEach(function() {
    dispatcher = new Dispatcher();
    dispatchedEvents = [];

    dispatcher.register(function(payload) {
      dispatchedEvents.push(payload);
    });

    FileUploaderAPI.__Rewire__('dispatcher', dispatcher);
    FileUploaderAPI.__Rewire__('Environment', EnvironmentMocker);
    FileUploaderAPI.__Rewire__('Constants', ConstantsMocker);
    FileUploaderAPI.__Rewire__('exceptionNotifier', {notify: _.noop});

    fileUploader = new FileUploader();

    mockFile = {
      name: 'fake-file.png',
      type: 'image/png',
      size: 1024 * 2
    };

    server = sinon.fakeServer.create();
    server.respondImmediately = true;
  });

  afterEach(function() {
    fileUploader.cancel();
    server.restore();

    FileUploaderAPI.__ResetDependency__('dispatcher');
    FileUploaderAPI.__ResetDependency__('Environment');
    FileUploaderAPI.__ResetDependency__('Constants');
    FileUploaderAPI.__ResetDependency__('exceptionNotifier');
  });

  function waitForActionThen(actionName, callback) {
    dispatcher.register(function(payload) {
      if (payload.action === actionName) {
        _.defer(callback, payload); // Make sure action gets processed fully, then callback.
      }
    });
  }

  describe('.upload()', function() {

    describe('file validations properly throw errors', function() {
      it('has valid file properties: name', function() {
        delete mockFile.name;
        assert.throws(function() { fileUploader.upload(mockFile); });
      });

      it('has valid file properties: type', function() {
        delete mockFile.type;
        assert.throws(function() { fileUploader.upload(mockFile); });
      });

      it('has valid file properties: size', function() {
        delete mockFile.size;
        assert.throws(function() { fileUploader.upload(mockFile); });
      });

      it('is an image', function() {
        mockFile.type = 'application/json';

        fileUploader.upload(mockFile);
        assert.equal(dispatchedEvents.length, 1);
        var dispatchedEvent = dispatchedEvents[0];
        assert.equal(dispatchedEvent.action, Actions.FILE_UPLOAD_ERROR);
        assert.equal(dispatchedEvent.error.step, 'validation_file_type');
      });

      it('is smaller than 5MB', function() {
        mockFile.size = 1024 * 5 + 1;
        fileUploader.upload(mockFile);

        assert.equal(dispatchedEvents.length, 1);
        var dispatchedEvent = dispatchedEvents[0];
        assert.equal(dispatchedEvent.action, Actions.FILE_UPLOAD_ERROR);
        assert.equal(dispatchedEvent.error.step, 'validation_file_size');
      });
    });

    describe('successful completion', function() {
      var uploadUrl = 'http://somestore.com/uploads/file.png';
      var documentUrl = 'http://somesotre.com/documents/1/file.png';
      var documentId = 1;

      beforeEach(function() {
        server.respondWith(
          'POST', '/stories/api/v1/uploads',
          [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ upload: { url: uploadUrl, content_type: 'image/jpeg' } }) //eslint-disable-line camelcase
          ]
        );

        server.respondWith(
          'PUT', uploadUrl,
          [
            200,
            {},
            ''
          ]
        );

        server.respondWith(
          'POST', '/stories/api/v1/documents',
          [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ document: { id: documentId } })
          ]
        );

        server.respondWith(
          'GET', StorytellerUtils.format('/stories/api/v1/documents/{0}', documentId),
          [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ document: { id: documentId, status: 'processed', url: documentUrl } })
          ]
        );

      });

      it('dispatches events including FILE_UPLOAD_DONE', function(done) {
        fileUploader.upload(mockFile);

        waitForActionThen('FILE_UPLOAD_DONE', function() {
          //assert.equal(dispatchedEvents.length, 3);

          assert.deepEqual(_.findWhere(dispatchedEvents, { 'action': 'FILE_UPLOAD_PROGRESS', percentLoaded: 0 }), {
            action: Actions.FILE_UPLOAD_PROGRESS,
            percentLoaded: 0
          });

          assert.deepEqual(_.findWhere(dispatchedEvents, { 'action': 'FILE_UPLOAD_PROGRESS', percentLoaded: 1 }), {
            action: Actions.FILE_UPLOAD_PROGRESS,
            percentLoaded: 1
          });

          assert.deepEqual(_.findWhere(dispatchedEvents, { 'action': 'FILE_UPLOAD_DONE' }), {
            action: Actions.FILE_UPLOAD_DONE,
            documentId: documentId,
            url: documentUrl
          });

          done();
        }, ConstantsMocker.CHECK_DOCUMENT_PROCESSED_RETRY_INTERVAL * 5);
      });
    });

    describe('fails to get upload url', function() {

      beforeEach(function() {
        server.respondWith(
          'POST', '/stories/api/v1/uploads',
          [
            422,
            {},
            ''
          ]
        );
      });

      it('dispatches event FILE_UPLOAD_ERROR', function(done) {

        fileUploader.upload(mockFile);

        waitForActionThen('FILE_UPLOAD_ERROR', function() {

          assert.deepEqual(_.findWhere(dispatchedEvents, { 'action': 'FILE_UPLOAD_PROGRESS', percentLoaded: 0 }), {
            action: Actions.FILE_UPLOAD_PROGRESS,
            percentLoaded: 0
          });

          assert.deepEqual(_.findWhere(dispatchedEvents, { 'action': 'FILE_UPLOAD_ERROR' }), {
            action: Actions.FILE_UPLOAD_ERROR,
            error: { step: 'get_upload_url', reason: {status: 422, message: 'Unprocessable Entity'} },
            errorReporting: {
              label: 'FileUploader#_emitError',
              message: 'FileUploader#_emitError: get_upload_url - Unprocessable Entity (story: four-four, status: 422)'
            }
          });

          assert.equal(server.requests.length, 1);

          done();
        });
      });
    });

    describe('fails to upload file', function() {
      var uploadUrl = 'http://somestore.com/uploads/file.png';

      beforeEach(function() {
        server.respondWith(
          'POST', '/stories/api/v1/uploads',
          [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ upload: { url: uploadUrl, content_type: 'image/jpeg' } })  //eslint-disable-line camelcase
          ]
        );

        server.respondWith(
          'PUT', uploadUrl,
          [
            403,
            {},
            ''
          ]
        );

      });

      it('dispatches FILE_UPLOAD_ERROR', function(done) {
        fileUploader.upload(mockFile);

        waitForActionThen('FILE_UPLOAD_ERROR', function() {

          assert.deepEqual(_.findWhere(dispatchedEvents, { 'action': 'FILE_UPLOAD_ERROR' }), {
            action: Actions.FILE_UPLOAD_ERROR,
            error: {
              step: 'upload_file',
              reason: { status: 403, message: 'Forbidden' }
            },
            errorReporting: {
              label: 'FileUploader#_emitError',
              message: 'FileUploader#_emitError: upload_file - Forbidden (story: four-four, status: 403)'
            }
          });

          assert.equal(server.requests.length, 2);

          done();
        }, ConstantsMocker.CHECK_DOCUMENT_PROCESSED_RETRY_INTERVAL * 2);
      });
    });

    describe('fails to save resource', function() {
      var uploadUrl = 'http://somestore.com/uploads/file.png';

      beforeEach(function() {
        server.respondWith(
          'POST', '/stories/api/v1/uploads',
          [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({
              upload: {
                url: uploadUrl,
                content_type: 'image/jpeg' //eslint-disable-line camelcase
              }
            })
          ]
        );

        server.respondWith(
          'PUT', uploadUrl,
          [
            200,
            {},
            ''
          ]
        );

        server.respondWith(
          'POST', '/stories/api/v1/documents',
          [
            500,
            {},
            ''
          ]
        );

      });

      it('dispatches progress events and an error', function(done) {
        fileUploader.upload(mockFile);

        waitForActionThen('FILE_UPLOAD_ERROR', function(errorAction) {

          assert.deepEqual(
            errorAction,
            {
              action: Actions.FILE_UPLOAD_ERROR,
              error: {
                step: 'save_resource',
                reason: { status: 500, message: 'Internal Server Error' }
              },
              errorReporting: {
                label: 'FileUploader#_emitError',
                message: 'FileUploader#_emitError: save_resource - Internal Server Error (story: four-four, status: 500)'
              }
            }
          );

          assert.equal(server.requests.length, 3);

          done();
        }, ConstantsMocker.CHECK_DOCUMENT_PROCESSED_RETRY_INTERVAL * 2);
      });
    });

    describe('fails to get processed resource', function() {
      var uploadUrl = 'http://somestore.com/uploads/file.png';
      var documentId = 1;

      beforeEach(function() {
        server.respondWith(
          'POST', '/stories/api/v1/uploads',
          [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({
              upload: {
                url: uploadUrl,
                content_type: 'image/jpeg' //eslint-disable-line camelcase
              }
            })
          ]
        );

        server.respondWith(
          'PUT', uploadUrl,
          [
            200,
            {},
            ''
          ]
        );

        server.respondWith(
          'POST', '/stories/api/v1/documents',
          [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ document: { id: documentId } })
          ]
        );

        server.respondWith(
          'GET',
          StorytellerUtils.format(
            '/stories/api/v1/documents/{0}',
            documentId
          ),
          [
            400,
            {},
            ''
          ]
        );

      });

      it('dispatches FILE_UPLOAD_ERROR', function(done) {
        fileUploader.upload(mockFile);

        waitForActionThen('FILE_UPLOAD_ERROR', function(errorAction) {

          assert.deepEqual(
            errorAction,
            {
              action: Actions.FILE_UPLOAD_ERROR,
              error: {
                step: 'get_resource',
                reason: { status: 400, message: 'Bad Request' }
              },
              errorReporting: {
                label: 'FileUploader#_emitError',
                message: 'FileUploader#_emitError: get_resource - Bad Request (story: four-four, status: 400)'
              }
            }
          );

          done();
        }, ConstantsMocker.CHECK_DOCUMENT_PROCESSED_RETRY_INTERVAL * 4);
      });
    });
  });

  describe('.cancel()', function() {
    // TODO implement and test a destroy method that removes event handlers and timers
  });
});
