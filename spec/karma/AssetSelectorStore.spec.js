describe('AssetSelectorStore', function() {

  'use strict';
  var storyteller = window.socrata.storyteller;

  function dispatch(action) {
    storyteller.dispatcher.dispatch(action);
  }

  describe('asset selector data accessors', function() {

    describe('when in an uninitialized state', function() {

      describe('.getCurrentSelectorState()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getCurrentSelectorState(), null);
        });
      });

      describe('.getCurrentBlockId()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getCurrentBlockId(), null);
        });
      });

      describe('.getCurrentComponentIndex()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getCurrentComponentIndex(), null);
        });
      });

      describe('.getCurrentComponentType()', function() {

        it('should return "assetSelector"', function() {
          assert.equal(storyteller.assetSelectorStore.getCurrentComponentType(), 'assetSelector');
        });
      });

      describe('.getCurrentComponentValue()', function() {

        it('should return an empty object', function() {

          var value = storyteller.assetSelectorStore.getCurrentComponentValue();

          assert.isObject(value, 'object');
        });
      });

      describe('.isValid()', function() {

        it('should return false', function() {
          assert.isFalse(storyteller.assetSelectorStore.isValid());
        });
      });
    });

    describe('after an `ASSET_SELECTOR_CHOOSE_PROVIDER` action', function() {

      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Constants.ASSET_SELECTOR_CHOOSE_PROVIDER,
          blockId: testBlockId,
          componentIndex: testComponentIndex
        });
      });

      describe('.getCurrentSelectorState()', function() {

        it('should return the action specified in the action payload', function() {
          assert.equal(storyteller.assetSelectorStore.getCurrentSelectorState(), Constants.ASSET_SELECTOR_CHOOSE_PROVIDER);
        });
      });

      describe('.getCurrentBlockId()', function() {

        it('should return the blockId specified in the action payload', function() {
          assert.equal(storyteller.assetSelectorStore.getCurrentBlockId(), testBlockId);
        });
      });

      describe('.getCurrentComponentIndex()', function() {

        it('should return the componentIndex specified in the action payload', function() {
          assert.equal(storyteller.assetSelectorStore.getCurrentComponentIndex(), testComponentIndex);
        });
      });

      describe('.isValid()', function() {

        it('should return false', function() {
          assert.isFalse(storyteller.assetSelectorStore.isValid());
        });
      });
    });

    describe('after an `ASSET_SELECTOR_CLOSE` action', function() {

      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Constants.ASSET_SELECTOR_CHOOSE_PROVIDER,
          blockId: testBlockId,
          componentIndex: testComponentIndex
        });

        storyteller.dispatcher.dispatch({
          action: Constants.ASSET_SELECTOR_CLOSE
        });
      });

      describe('.getCurrentSelectorState()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getCurrentSelectorState(), null);
        });
      });

      describe('.getCurrentBlockId()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getCurrentBlockId(), null);
        });
      });

      describe('.getCurrentComponentIndex()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getCurrentComponentIndex(), null);
        });
      });

      describe('.isValid()', function() {

        it('should return false', function() {
          assert.isFalse(storyteller.assetSelectorStore.isValid());
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
          action: Constants.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: false
        });

        var request = server.requests[0];
        assert.equal(request.method, 'GET');
        assert.equal(request.url, migrationUrl);
      });

      it('should not request API migrations if dataset is already NBE', function() {
        storyteller.dispatcher.dispatch({
          action: Constants.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: true
        });

        assert.isDefined(server);
        assert.isUndefined(server.requests[0]);
      });

      it('should add datasetUid to _currentComponentProperities', function() {
        storyteller.dispatcher.dispatch({
          action: Constants.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: true
        });

        assert.equal(
          storyteller.assetSelectorStore.getCurrentComponentValue().dataSource.uid,
          standardMocks.validStoryUid
        );
      });

    });

    describe('after an `ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION` action', function() {

      beforeEach(function() {
        // Send in dataset uid so ComponentValues.value.settings exists
        storyteller.dispatcher.dispatch({
          action: Constants.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: true
        });
      });

      it('does not change baseQuery if payload has no cardData', function() {
        var startingComponentValue = _.cloneDeep(storyteller.assetSelectorStore.getCurrentComponentValue());

        storyteller.dispatcher.dispatch({
          action: Constants.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          cardData: null
        });

        assert.deepEqual(
          startingComponentValue,
          storyteller.assetSelectorStore.getCurrentComponentValue()
        )
      });

      it('adds visualization configuration to componentValue when there is cardData', function() {
        var fakeCardData = {
          'cardType': 'column',
          'fieldName': 'test_field'
        };

        storyteller.dispatcher.dispatch({
          action: Constants.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          cardData: fakeCardData
        });

        assert.equal(
          storyteller.assetSelectorStore.getCurrentComponentType(),
          'socrata.visualization.columnChart'
        );

        assert.include(
          storyteller.assetSelectorStore.getCurrentComponentValue().dataSource.baseQuery,
          fakeCardData.fieldName
        );

      })
    });

  });
});
