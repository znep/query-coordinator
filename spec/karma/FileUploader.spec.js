describe('FileUploader', function() {
  'use strict';

  var storyteller = window.socrata.storyteller;
  var dispatchedEvents;
  var server;
  var fileUploader;
  var mockFile;

  beforeEach(function() {
    fileUploader = new storyteller.FileUploader();

    dispatchedEvents = [];

    mockFile = {
      name: 'fake-file.png',
      type: 'image/png',
      size: 1024 * 2
    };

    storyteller.userStoryUid = 'four-four';

    storyteller.dispatcher.register(function(payload) {
      dispatchedEvents.push(payload);
    });

    server = sinon.fakeServer.create();
    server.respondImmediately = true;
  });

  afterEach(function() {
    server.restore();
    fileUploader.destroy();
  });

  describe('.upload()', function() {

    // TODO would love to get this working as a refactor

    // describe('when an upload is in progress', function() {
    //   beforeEach(function() {
    //     sinon.spy(fileUploader, 'destroy');
    //   });

    //   afterEach(function() {
    //     fileUploader.destroy.restore();
    //   });

    //   it('cancels any uploads in progress', function() {
    //     fileUploader.upload(mockFile);
    //     assert.isTrue(fileUploader.destroy.calledOnce);
    //   });
    // });

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
          'GET', '/stories/api/v1/documents/{0}'.format(documentId),
          [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ document: { id: documentId, status: 'processed', url: documentUrl } })
          ]
        );

      });

      it('dispatches events including FILE_UPLOAD_DONE', function(done) {
        fileUploader.upload(mockFile);

        setTimeout(function() {
          assert.equal(dispatchedEvents.length, 3);

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
        }, storyteller.config.fileUploader.checkDocumentProcessedRetryInterval * 5);
      });
    });

    describe('fails to get upload url', function() {

      beforeEach(function() {
        server = sinon.fakeServer.create();
        server.respondImmediately = true;

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

        setTimeout(function() {

          assert.deepEqual(_.findWhere(dispatchedEvents, { 'action': 'FILE_UPLOAD_PROGRESS', percentLoaded: 0 }), {
            action: Actions.FILE_UPLOAD_PROGRESS,
            percentLoaded: 0
          });

          assert.deepEqual(_.findWhere(dispatchedEvents, { 'action': 'FILE_UPLOAD_ERROR' }), {
            action: Actions.FILE_UPLOAD_ERROR,
            error: { step: 'get_upload_url', reason: {status: 422, message: 'Unprocessable Entity'} }
          });

          assert.equal(server.requests.length, 1);

          done();
        }, 50);
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

        setTimeout(function() {

          assert.deepEqual(_.findWhere(dispatchedEvents, { 'action': 'FILE_UPLOAD_ERROR' }), {
            action: Actions.FILE_UPLOAD_ERROR,
            error: {
              step: 'upload_file',
              reason: { status: 403, message: 'Forbidden' }
            }
          });

          assert.equal(server.requests.length, 2);

          done();
        }, storyteller.config.fileUploader.checkDocumentProcessedRetryInterval * 2);
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

        setTimeout(function() {

          assert.deepEqual(_.findWhere(dispatchedEvents, { 'action': 'FILE_UPLOAD_ERROR' }), {
            action: Actions.FILE_UPLOAD_ERROR,
            error: {
              step: 'save_resource',
              reason: { status: 500, message: 'Internal Server Error' }
            }
          });

          assert.equal(server.requests.length, 3);

          done();
        }, storyteller.config.fileUploader.checkDocumentProcessedRetryInterval * 2);
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
          'GET', '/stories/api/v1/documents/{0}'.format(documentId),
          [
            400,
            {},
            ''
          ]
        );

      });

      it('dispatches FILE_UPLOAD_ERROR', function(done) {
        fileUploader.upload(mockFile);

        setTimeout(function() {

          assert.deepEqual(_.findWhere(dispatchedEvents, { 'action': 'FILE_UPLOAD_ERROR' }), {
            action: Actions.FILE_UPLOAD_ERROR,
            error: {
              step: 'get_resource',
              reason: { status: 400, message: 'Bad Request' }
            }
          });

          // account for retries
          assert.equal(server.requests.length, 6);

          done();
        }, storyteller.config.fileUploader.checkDocumentProcessedRetryInterval * 4);
      });
    });
  });

  describe('.destroy()', function() {
    // TODO implement and test a destroy method that removes event handlers and timers
  });
});
