import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import Actions from '../../app/assets/javascripts/editor/Actions';
import StoryStore from '../../app/assets/javascripts/editor/stores/StoryStore';
import Dispatcher from '../../app/assets/javascripts/editor/Dispatcher';
import StoryPermissionsManager, { __RewireAPI__ as StoryPermissionsManagerAPI } from '../../app/assets/javascripts/editor/StoryPermissionsManager';

import EnvironmentMocker from './StorytellerEnvironmentMocker';

describe('StoryPermissionsManager', () => {

  let manager;
  let dispatcher;
  let httpRequestStub;
  let httpRequestPromiseResolve;
  let httpRequestPromiseReject;

  beforeEach(() => {
    const storyStoreStub = sinon.createStubInstance(StoryStore);
    storyStoreStub.getStoryDigest = _.constant('test-digest');

    const httpRequestPromise = new Promise((resolve, reject) => {
      httpRequestPromiseResolve = resolve;
      httpRequestPromiseReject = reject;
    });

    dispatcher = new Dispatcher();
    httpRequestStub = sinon.stub();
    httpRequestStub.returns(httpRequestPromise);

    StoryPermissionsManagerAPI.__Rewire__('httpRequest', httpRequestStub);
    StoryPermissionsManagerAPI.__Rewire__('Environment', EnvironmentMocker);
    StoryPermissionsManagerAPI.__Rewire__('storyStore', storyStoreStub);
    StoryPermissionsManagerAPI.__Rewire__('dispatcher', dispatcher);

    manager = new StoryPermissionsManager();
  });

  afterEach(() => {
    StoryPermissionsManagerAPI.__ResetDependency__('httpRequest');
    StoryPermissionsManagerAPI.__ResetDependency__('Environment');
    StoryPermissionsManagerAPI.__ResetDependency__('storyStore');
    StoryPermissionsManagerAPI.__ResetDependency__('dispatcher');
  });

  function testVariant(apiName, expectedUrl, expectedHttpMethod, expectedData, expectedActions) {
    describe('.' + apiName, () => {
      it('should throw on non- arguments', () => {
        assert.throws(() => { manager[apiName](2); });
        assert.throws(() => { manager[apiName]({}); });
        assert.throws(() => { manager[apiName](''); });
        assert.throws(() => { manager[apiName](null); });
      });

      describe('given an error callback', () => {
        let errorSpy;

        beforeEach(() => {
          errorSpy = sinon.spy();
          manager[apiName](errorSpy);
        });

        it('should make one {0} to {1}'.format(expectedHttpMethod, expectedUrl), () => {
          sinon.assert.calledOnce(httpRequestStub);
          sinon.assert.calledWithMatch(
            httpRequestStub,
            expectedHttpMethod,
            expectedUrl
          );
        });

        describe('that succeeds', () => {
          let data;
          let actions;

          beforeEach(() => {
            data = { data: expectedData };

            _.each(expectedActions, (expectedAction) => {
              expectedAction.storyUid = EnvironmentMocker.STORY_UID;
            });

            actions = [];

            dispatcher.register((payload) => {
              actions.push(payload);
            });

            httpRequestPromiseResolve(data);
          });

          it('should not call the error callback', (done) => {
            _.defer(() => {
              sinon.assert.notCalled(errorSpy);
              done();
            });
          });

          it('should emit expected actions only', (done) => {
            _.defer(() => {
              assert.deepEqual(
                actions,
                expectedActions
              );
              done();
            });
          });
        });

        describe('that fails', () => {
          beforeEach(() => {
            sinon.stub(window.console, 'error');
            httpRequestPromiseReject('expected');
          });

          afterEach(() => {
            window.console.error.restore();
          });

          it('should call the error callback', (done) => {
            _.defer(() => {
              sinon.assert.calledOnce(errorSpy);
              done();
            });
          });

          it('should log an error to the console', (done) => {
            _.defer(() => {
              sinon.assert.called(console.error);
              done();
            });
          });
        });
      });
    });
  }

  const publicActions = [{
    action: Actions.STORY_SET_PUBLISHED_STORY,
    storyUid: 'not defined yet',
    publishedStory: { isPublic: true }
  }, {
    action: Actions.STORY_SET_PERMISSIONS,
    storyUid: 'not defined yet',
    isPublic: true
  }];

  const privateActions = [{
    action: Actions.STORY_SET_PERMISSIONS,
    storyUid: 'not defined yet',
    isPublic: false
  }];

  // TODO: we'd ideally like to test that we use a different endpoint when
  // Environment.IS_GOAL === true, but that requires unraveling some of this
  // fancy test structure.

  testVariant('makePublic', '/stories/api/v1/stories/four-four/published', 'POST', { isPublic: true }, publicActions, JSON.stringify({ digest: 'test-digest' }));
  testVariant('makePrivate', '/stories/api/v1/stories/four-four/permissions', 'PUT', { isPublic: false }, privateActions, JSON.stringify({ isPublic: false }));
});
