import _ from 'lodash';

import Actions from '../../app/assets/javascripts/editor/Actions';
import StoryStore from '../../app/assets/javascripts/editor/stores/StoryStore';
import Dispatcher from '../../app/assets/javascripts/editor/Dispatcher';
import StorytellerUtils from '../../app/assets/javascripts/StorytellerUtils';
import StoryPermissionsManager, {__RewireAPI__ as StoryPermissionsManagerAPI} from '../../app/assets/javascripts/editor/StoryPermissionsManager';

import EnvironmentMocker from './StorytellerEnvironmentMocker';

describe('StoryPermissionsManager', function() {

  var manager;
  var dispatcher;

  beforeEach(function() {
    manager = new StoryPermissionsManager();
  });

  var storytellerApiRequestStub;
  var storytellerApiRequestPromiseResolve;
  var storytellerApiRequestPromiseReject;

  beforeEach(function() {
    var storyStoreStub = sinon.createStubInstance(StoryStore);
    storyStoreStub.getStoryDigest = _.constant('test-digest');

    var StorytellerUtilsMocker = _.cloneDeep(StorytellerUtils);
    var storytellerApiRequestPromise = new Promise(function(resolve, reject) {
      storytellerApiRequestPromiseResolve = resolve;
      storytellerApiRequestPromiseReject = reject;
    });

    dispatcher = new Dispatcher();
    storytellerApiRequestStub = sinon.stub(StorytellerUtilsMocker, 'storytellerApiRequest', _.constant(storytellerApiRequestPromise));

    StoryPermissionsManagerAPI.__Rewire__('StorytellerUtils', StorytellerUtilsMocker);
    StoryPermissionsManagerAPI.__Rewire__('Environment', EnvironmentMocker);
    StoryPermissionsManagerAPI.__Rewire__('storyStore', storyStoreStub);
    StoryPermissionsManagerAPI.__Rewire__('dispatcher', dispatcher);
  });

  afterEach(function() {
    storytellerApiRequestStub.restore();
    StoryPermissionsManagerAPI.__ResetDependency__('StorytellerUtils');
    StoryPermissionsManagerAPI.__ResetDependency__('Environment');
    StoryPermissionsManagerAPI.__ResetDependency__('storyStore');
    StoryPermissionsManagerAPI.__ResetDependency__('dispatcher');
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
              expectedAction.storyUid = EnvironmentMocker.STORY_UID;
            });
            actions = [];
            dispatcher.register(function(payload) {
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

  testVariant('makePublic', 'stories/four-four/published', 'POST', { isPublic: true }, publicActions, JSON.stringify({ digest: 'test-digest' }));
  testVariant('makePrivate', 'stories/four-four/permissions', 'PUT', { isPublic: false }, privateActions, JSON.stringify({ isPublic: false }));

});
