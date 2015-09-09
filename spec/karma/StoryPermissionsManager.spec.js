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

  function testVariant(apiName, expectedUrl, expectedHttpMethod, expectedPayload) {
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

        describe('that succeeds with no uid in the data', function() {
          var data;
          var actions;
          beforeEach(function() {
            data = {
              isPublic: false
            };
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

          it('should emit STORY_SET_PERMISSIONS only', function(done) {
            _.defer(function() {
              assert.deepEqual(
                actions,
                [
                  {
                    action: Constants.STORY_SET_PERMISSIONS,
                    storyUid: storyteller.userStoryUid,
                    isPublic: false
                  }
                ]
              );
              done();
            });
          });
          
        });

        describe('that succeeds with a uid in the data', function() {
          var data;
          var actions;
          beforeEach(function() {
            data = {
              uid: 'foo',
              isPublic: false
            };
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

          it('should emit STORY_SET_PUBLISHED_STORY and STORY_SET_PERMISSIONS', function(done) {
            _.defer(function() {
              assert.deepEqual(
                actions,
                [
                  {
                    action: Constants.STORY_SET_PUBLISHED_STORY,
                    storyUid: storyteller.userStoryUid,
                    publishedStory: data
                  },
                  {
                    action: Constants.STORY_SET_PERMISSIONS,
                    storyUid: storyteller.userStoryUid,
                    isPublic: false
                  }
                ]
              );
              done();
            });
          });
          
        });

        describe('that fails', function() {
          beforeEach(function() {
            storytellerApiRequestPromiseReject('expected');
          });

          it('should call the error callback', function(done) {
            _.defer(function() {
              sinon.assert.calledOnce(errorSpy);
              done();
            });
          });
        });
      });
    });
  }

  testVariant('makePublic', 'stories/test-test/published', 'POST', JSON.stringify({ digest: 'test-digest' }));
  testVariant('makePrivate', 'stories/test-test/permissions', 'PUT', JSON.stringify({ isPublic: false }));

});
