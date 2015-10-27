describe('StoryPermissionsManager', function() {

  'use strict';

  var storyteller = window.socrata.storyteller;
  var manager;

  beforeEach(function() {
    manager = new storyteller.StoryPermissionsManager();
    storyteller.userStoryUid = standardMocks.validStoryUid;
  });

  afterEach(function() {
    delete storyteller.userStoryUid;
  });

  var storytellerApiRequestStub;
  var storytellerApiRequestPromiseResolve;
  var storytellerApiRequestPromiseReject;

  beforeEach(function() {
    var storytellerApiRequestPromise = new Promise(function(resolve, reject) {
      storytellerApiRequestPromiseResolve = resolve;
      storytellerApiRequestPromiseReject = reject;
    });

    storytellerApiRequestStub = sinon.stub(socrata.utils, 'storytellerApiRequest', _.constant(storytellerApiRequestPromise));
  });

  afterEach(function() {
    storytellerApiRequestStub.restore();
  });

  function testVariant(apiName, expectedUrl, expectedHttpMethod, expectedData, expectedActions, expectedPayload) {
    describe('.' + apiName, function() {
      it('should throw on non-function arguments', function() {
        assert.throws(function() { manager[apiName](2); });
        assert.throws(function() { manager[apiName]({}); });
        assert.throws(function() { manager[apiName](''); });
        assert.throws(function() { manager[apiName](null); });
      });

      describe('given an error callback', function() {
        var errorSpy;

        beforeEach(function() {
          errorSpy = sinon.spy();
          manager[apiName](errorSpy);
        });

        it('should make one {0} to {1}'.format(expectedHttpMethod, expectedUrl), function() {
          sinon.assert.calledOnce(storytellerApiRequestStub);
          sinon.assert.calledWithExactly(
            storytellerApiRequestStub,
            expectedUrl,
            expectedHttpMethod,
            expectedPayload
          );
        });

        describe('that succeeds', function() {
          var data;
          var actions;
          beforeEach(function() {
            data = expectedData;
            _.each(expectedActions, function(expectedAction) {
              expectedAction.storyUid = storyteller.userStoryUid;
            });
            actions = [];
            storyteller.dispatcher.register(function(payload) {
              actions.push(payload);
            });
            storytellerApiRequestPromiseResolve(data);
          });

          it('should not call the error callback', function(done) {
            _.defer(function() {
              sinon.assert.notCalled(errorSpy);
              done();
            });
          });

          it('should emit expected actions only', function(done) {
            _.defer(function() {
              assert.deepEqual(
                actions,
                expectedActions
              );
              done();
            });
          });
        });

        describe('that fails', function() {
          beforeEach(function() {
            sinon.stub(window.console, 'error');
            storytellerApiRequestPromiseReject('expected');
          });

          afterEach(function() {
            window.console.error.restore();
          });

          it('should call the error callback', function(done) {
            _.defer(function() {
              sinon.assert.calledOnce(errorSpy);
              done();
            });
          });

          it('should log an error to the console', function(done) {
            _.defer(function() {
              sinon.assert.called(console.error);
              done();
            });
          });
        });
      });
    });
  }

  var publicActions = [{
    action: Actions.STORY_SET_PUBLISHED_STORY,
    storyUid: 'not defined yet',
    publishedStory: { isPublic: true }
  }, {
    action: Actions.STORY_SET_PERMISSIONS,
    storyUid: 'not defined yet',
    isPublic: true
  }];

  var privateActions = [{
    action: Actions.STORY_SET_PERMISSIONS,
    storyUid: 'not defined yet',
    isPublic: false
  }];

  testVariant('makePublic', 'stories/test-test/published', 'POST', { isPublic: true }, publicActions, JSON.stringify({ digest: 'test-digest' }));
  testVariant('makePrivate', 'stories/test-test/permissions', 'PUT', { isPublic: false }, privateActions, JSON.stringify({ isPublic: false }));

});
