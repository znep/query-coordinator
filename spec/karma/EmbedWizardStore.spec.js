describe('EmbedWizardStore', function() {

  'use strict';
  var storyteller = window.socrata.storyteller;

  function dispatch(action) {
    storyteller.dispatcher.dispatch(action);
  }

  describe('embed wizard data accessors', function() {

    describe('when in an uninitialized state', function() {

      describe('.getCurrentWizardState()', function() {

        it('should return null', function() {
          assert.equal(storyteller.embedWizardStore.getCurrentWizardState(), null);
        });
      });

      describe('.getCurrentBlockId()', function() {

        it('should return null', function() {
          assert.equal(storyteller.embedWizardStore.getCurrentBlockId(), null);
        });
      });

      describe('.getCurrentComponentIndex()', function() {

        it('should return null', function() {
          assert.equal(storyteller.embedWizardStore.getCurrentComponentIndex(), null);
        });
      });

      describe('.getCurrentComponentType()', function() {

        it('should return "media"', function() {
          assert.equal(storyteller.embedWizardStore.getCurrentComponentType(), 'media');
        });
      });

      describe('.getCurrentComponentValue()', function() {

        it('should return an object with `type` set to "embed" and `value` set to an object with a `provider` property of "wizard"', function() {

          var value = storyteller.embedWizardStore.getCurrentComponentValue();

          assert.equal(value.type, 'embed');
          assert.equal(value.value.provider, 'wizard');
        });
      });

      describe('.isValid()', function() {

        it('should return false', function() {
          assert.isFalse(storyteller.embedWizardStore.isValid());
        });
      });
    });

    describe('after an `EMBED_WIZARD_CHOOSE_PROVIDER` action', function() {

      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
          blockId: testBlockId,
          componentIndex: testComponentIndex
        });
      });

      describe('.getCurrentWizardState()', function() {

        it('should return the action specified in the action payload', function() {
          assert.equal(storyteller.embedWizardStore.getCurrentWizardState(), Constants.EMBED_WIZARD_CHOOSE_PROVIDER);
        });
      });

      describe('.getCurrentBlockId()', function() {

        it('should return the blockId specified in the action payload', function() {
          assert.equal(storyteller.embedWizardStore.getCurrentBlockId(), testBlockId);
        });
      });

      describe('.getCurrentComponentIndex()', function() {

        it('should return the componentIndex specified in the action payload', function() {
          assert.equal(storyteller.embedWizardStore.getCurrentComponentIndex(), testComponentIndex);
        });
      });

      describe('.isValid()', function() {

        it('should return false', function() {
          assert.isFalse(storyteller.embedWizardStore.isValid());
        });
      });
    });

    describe('after an `EMBED_WIZARD_CLOSE` action', function() {

      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
          blockId: testBlockId,
          componentIndex: testComponentIndex
        });

        storyteller.dispatcher.dispatch({
          action: Constants.EMBED_WIZARD_CLOSE
        });
      });

      describe('.getCurrentWizardState()', function() {

        it('should return null', function() {
          assert.equal(storyteller.embedWizardStore.getCurrentWizardState(), null);
        });
      });

      describe('.getCurrentBlockId()', function() {

        it('should return null', function() {
          assert.equal(storyteller.embedWizardStore.getCurrentBlockId(), null);
        });
      });

      describe('.getCurrentComponentIndex()', function() {

        it('should return null', function() {
          assert.equal(storyteller.embedWizardStore.getCurrentComponentIndex(), null);
        });
      });

      describe('.isValid()', function() {

        it('should return false', function() {
          assert.isFalse(storyteller.embedWizardStore.isValid());
        });
      });
    });

    describe('after an `EMBED_WIZARD_CHOOSE_VISUALIZATION_DATASET` action', function() {
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
          action: Constants.EMBED_WIZARD_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: false
        });

        var request = server.requests[0];
        assert.equal(request.method, 'GET');
        assert.equal(request.url, migrationUrl);
      });

      it('should not request API migrations if dataset is already NBE', function() {
        storyteller.dispatcher.dispatch({
          action: Constants.EMBED_WIZARD_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: true
        });

        assert.isDefined(server);
        assert.isUndefined(server.requests[0]);
      });

      it('should add datasetUid to _currentComponentProperities', function() {
        storyteller.dispatcher.dispatch({
          action: Constants.EMBED_WIZARD_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: true
        });

        assert.equal(
          storyteller.embedWizardStore.getCurrentComponentValue().value.settings.datasetUid,
          standardMocks.validStoryUid
        );
      });

    });

    describe('after an `EMBED_WIZARD_UPDATE_VISUALIZATION_CONFIGURATION` action', function() {

      beforeEach(function() {
        // Send in dataset uid so ComponentValues.value.settings exists
        storyteller.dispatcher.dispatch({
          action: Constants.EMBED_WIZARD_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: true
        });
      });

      it('does not change currentComponendValue if payload has no cardData', function() {
        assert.doesNotChange(function() {
            storyteller.dispatcher.dispatch({
              action: Constants.EMBED_WIZARD_UPDATE_VISUALIZATION_CONFIGURATION,
              cardData: null
            });
          },
          storyteller.embedWizardStore.getCurrentComponentValue(), //thing that might change
          'value' //property on it that might change
        );
      });

      it('adds `settings.visualization` to componentValue when there is cardData', function() {
        var fakeCardData = {'fakeformat': 'true'};

        storyteller.dispatcher.dispatch({
          action: Constants.EMBED_WIZARD_UPDATE_VISUALIZATION_CONFIGURATION,
          cardData: fakeCardData
        });

        assert.equal(
          storyteller.embedWizardStore.getCurrentComponentValue().value.settings.visualization,
          fakeCardData
        );

      })
    });

  });
});
