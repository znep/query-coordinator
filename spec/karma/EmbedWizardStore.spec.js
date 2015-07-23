describe('StoryStore', function() {

  'use strict';

  function dispatch(action) {
    window.dispatcher.dispatch(action);
  }

  describe('embed wizard data accessors', function() {

    describe('when in an uninitialized state', function() {

      describe('.getCurrentWizardState()', function() {

        it('should return null', function() {
          assert.equal(window.embedWizardStore.getCurrentWizardState(), null);
        });
      });

      describe('.getCurrentBlockId()', function() {

        it('should return null', function() {
          assert.equal(window.embedWizardStore.getCurrentBlockId(), null);
        });
      });

      describe('.getCurrentComponentIndex()', function() {

        it('should return null', function() {
          assert.equal(window.embedWizardStore.getCurrentComponentIndex(), null);
        });
      });

      describe('.getCurrentComponentType()', function() {

        it('should return "media"', function() {
          assert.equal(window.embedWizardStore.getCurrentComponentType(), 'media');
        });
      });

      describe('.getCurrentComponentValue()', function() {

        it('should return an object with `type` set to "embed" and `value` set to an object with a `provider` property of "wizard"', function() {

          var value = window.embedWizardStore.getCurrentComponentValue();

          assert.equal(value.type, 'embed');
          assert.equal(value.value.provider, 'wizard');
        });
      });

      describe('.isValid()', function() {

        it('should return false', function() {
          assert.isFalse(window.embedWizardStore.isValid());
        });
      });
    });

    describe('after an `EMBED_WIZARD_CHOOSE_PROVIDER` action', function() {

      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        window.dispatcher.dispatch({
          action: Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
          blockId: testBlockId,
          componentIndex: testComponentIndex
        });
      });

      describe('.getCurrentWizardState()', function() {

        it('should return the action specified in the action payload', function() {
          assert.equal(window.embedWizardStore.getCurrentWizardState(), Constants.EMBED_WIZARD_CHOOSE_PROVIDER);
        });
      });

      describe('.getCurrentBlockId()', function() {

        it('should return the blockId specified in the action payload', function() {
          assert.equal(window.embedWizardStore.getCurrentBlockId(), testBlockId);
        });
      });

      describe('.getCurrentComponentIndex()', function() {

        it('should return the componentIndex specified in the action payload', function() {
          assert.equal(window.embedWizardStore.getCurrentComponentIndex(), testComponentIndex);
        });
      });

      describe('.isValid()', function() {

        it('should return false', function() {
          assert.isFalse(window.embedWizardStore.isValid());
        });
      });
    });

    describe('after an `EMBED_WIZARD_CLOSE` action', function() {

      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        window.dispatcher.dispatch({
          action: Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
          blockId: testBlockId,
          componentIndex: testComponentIndex
        });

        window.dispatcher.dispatch({
          action: Constants.EMBED_WIZARD_CLOSE
        });
      });

      describe('.getCurrentWizardState()', function() {

        it('should return null', function() {
          assert.equal(window.embedWizardStore.getCurrentWizardState(), null);
        });
      });

      describe('.getCurrentBlockId()', function() {

        it('should return null', function() {
          assert.equal(window.embedWizardStore.getCurrentBlockId(), null);
        });
      });

      describe('.getCurrentComponentIndex()', function() {

        it('should return null', function() {
          assert.equal(window.embedWizardStore.getCurrentComponentIndex(), null);
        });
      });

      describe('.isValid()', function() {

        it('should return false', function() {
          assert.isFalse(window.embedWizardStore.isValid());
        });
      });
    });

  });
});
