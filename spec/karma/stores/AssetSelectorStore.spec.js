describe('AssetSelectorStore', function() {

  'use strict';
  var storyteller = window.socrata.storyteller;

  describe('asset selector data accessors', function() {

    describe('when in an uninitialized state', function() {

      describe('.getStep()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getStep(), null);
        });
      });

      describe('.getBlockId()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getBlockId(), null);
        });
      });

      describe('.getComponentIndex()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getComponentIndex(), null);
        });
      });

      describe('.getComponentType()', function() {

        it('should return undefined', function() {
          assert.isUndefined(storyteller.assetSelectorStore.getComponentType());
        });
      });

      describe('.getComponentValue()', function() {

        it('should return undefined', function() {

          var value = storyteller.assetSelectorStore.getComponentValue();

          assert.isUndefined(value);
        });
      });

    });

    describe('after an `ASSET_SELECTOR_CHOOSE_PROVIDER` action', function() {

      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_PROVIDER,
          blockId: testBlockId,
          componentIndex: testComponentIndex
        });
      });

      describe('.getStep()', function() {

        it('should return the action specified in the action payload', function() {
          assert.equal(storyteller.assetSelectorStore.getStep(), Actions.ASSET_SELECTOR_CHOOSE_PROVIDER);
        });
      });

      describe('.getBlockId()', function() {

        it('should return the blockId specified in the action payload', function() {
          assert.equal(storyteller.assetSelectorStore.getBlockId(), testBlockId);
        });
      });

      describe('.getComponentIndex()', function() {

        it('should return the componentIndex specified in the action payload', function() {
          assert.equal(storyteller.assetSelectorStore.getComponentIndex(), testComponentIndex);
        });
      });

    });

    describe('after an `ASSET_SELECTOR_CLOSE` action', function() {

      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_PROVIDER,
          blockId: testBlockId,
          componentIndex: testComponentIndex
        });

        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CLOSE
        });
      });

      describe('.getStep()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getStep(), null);
        });
      });

      describe('.getBlockId()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getBlockId(), null);
        });
      });

      describe('.getComponentIndex()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getComponentIndex(), null);
        });
      });

    });

    describe('after an `ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET` action', function() {
      var server;
      var migrationUrl;

      beforeEach(function() {
        server = sinon.fakeServer.create();
        migrationUrl = '/api/migrations/{0}.json'.format(standardMocks.validStoryUid);
      });

      afterEach(function() {
        server.restore();
      });

      it('should attempt to fetch the NBE datasetUid if dataset is OBE', function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: false
        });

        var request = server.requests[0];
        assert.equal(request.method, 'GET');
        assert.equal(request.url, migrationUrl);
      });

      it('should not request API migrations if dataset is already NBE', function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: true
        });

        assert.isDefined(server);
        assert.isUndefined(server.requests[0]);
      });

      it('should add datasetUid to _currentComponentProperities', function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: true
        });

        assert.equal(
          storyteller.assetSelectorStore.getComponentValue().dataset.datasetUid,
          standardMocks.validStoryUid
        );
      });

    });

    describe('after an `ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION` action', function() {

      beforeEach(function() {
        // Send in dataset uid so ComponentValues.value.settings exists
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: true
        });
      });

      it('adds visualization configuration to componentValue when there is vif', function() {
        var payload = {
          'format': 'vif',
          'data': {
            type: 'columnChart'
          }
        };

        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          visualization: payload
        });

        assert.equal(
          storyteller.assetSelectorStore.getComponentType(),
          'socrata.visualization.columnChart'
        );
      })
    });


    describe('after a `FILE_UPLOAD_PROGRESS` action', function() {

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_PROGRESS,
          percentLoaded: 0.245
        });
      });

      describe('.getComponentValue()', function() {
        it('returns object with percentLoaded', function() {
          assert.deepEqual(
            storyteller.assetSelectorStore.getComponentValue(),
            { percentLoaded: 0.245 }
          );
        });
      });
    });

    describe('after a `FILE_UPLOAD_DONE` action', function() {

      var payloadUrl = 'https://validurl.com/image.png';
      var payloadDocumentId = '12345';

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_DONE,
          url: payloadUrl,
          documentId: payloadDocumentId
        });
      });

      describe('.getComponentType()', function() {
        it('returns `image`', function() {
          assert.equal(
            storyteller.assetSelectorStore.getComponentType(),
            'image'
          );
        });
      });

      describe('.getComponentValue()', function() {
        it('returns payload with url and documentId', function() {
          assert.deepEqual(
            storyteller.assetSelectorStore.getComponentValue(),
            { documentId: payloadDocumentId, url: payloadUrl }
          );
        });
      });
    });

    describe('after a `FILE_UPLOAD_ERROR` action', function() {

      describe('for file type validation error', function() {
        beforeEach(function() {
          storyteller.dispatcher.dispatch({
            action: Actions.FILE_UPLOAD_ERROR,
            error: {
              step: 'validation_file_type'
            }
          });
        });

        describe('.getComponentType()', function() {
          it('returns `imageUploadError`', function() {
            assert.equal(
              storyteller.assetSelectorStore.getComponentType(),
              'imageUploadError'
            );
          });
        });

        describe('.getComponentValue()', function() {
          it('returns `validation_file_type`', function() {
            assert.deepEqual(
              storyteller.assetSelectorStore.getComponentValue(),
              { step: 'validation_file_type' }
            );
          });
        });
      });

      describe('for file size validation error', function() {
        beforeEach(function() {
          storyteller.dispatcher.dispatch({
            action: Actions.FILE_UPLOAD_ERROR,
            error: {
              step: 'validation_file_size'
            }
          });
        });

        describe('.getComponentType()', function() {
          it('returns `imageUploadError`', function() {
            assert.equal(
              storyteller.assetSelectorStore.getComponentType(),
              'imageUploadError'
            );
          });
        });

        describe('.getComponentValue()', function() {
          it('returns `validation_file_size`', function() {
            assert.deepEqual(
              storyteller.assetSelectorStore.getComponentValue(),
              { step: 'validation_file_size' }
            );
          });
        });
      });

      describe('for other upload error with reason', function() {
        beforeEach(function() {
          storyteller.dispatcher.dispatch({
            action: Actions.FILE_UPLOAD_ERROR,
            error: {
              step: 'get_upload_url',
              reason: { status: 500, message: 'Internal Server Error' }
            }
          });
        });

        describe('.getComponentType()', function() {
          it('returns `imageUploadError`', function() {
            assert.equal(
              storyteller.assetSelectorStore.getComponentType(),
              'imageUploadError'
            );
          });
        });

        describe('.getComponentValue()', function() {
          it('returns `get_upload_url`', function() {
            assert.deepEqual(
              storyteller.assetSelectorStore.getComponentValue(),
              { step: 'get_upload_url', reason: { status: 500, message: 'Internal Server Error' } }
            );
          });
        });
      });
    });
  });
});
