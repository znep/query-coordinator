import sinon from 'sinon';

import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import GoalTitleProvider, {__RewireAPI__ as GoalTitleProviderAPI} from 'editor/GoalTitleProvider';

describe('GoalTitleProvider', () => {
  let dispatchStub;
  let goalId = 'more-pufn';
  let goalTitleProvider;
  let server;
  let title = 'Raise puffin population above rabbit population';

  const getDispatcher = () => {
    const dispatcher = new Dispatcher();
    dispatchStub = sinon.stub(dispatcher, 'dispatch');
    return dispatcher;
  };

  const rewires = () => {
    GoalTitleProviderAPI.__Rewire__('dispatcher', getDispatcher());
  };

  const resets = () => {
    dispatchStub.reset();
    GoalTitleProviderAPI.__ResetDependency__('dispatcher');
  };

  beforeEach(() => {
    rewires();
    goalTitleProvider = new GoalTitleProvider();
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(() => {
    resets();
  });


  describe('changeTitle', () => {
    let url;

    beforeEach(() => {
      url = `/api/stat/v1/goals/${goalId}.json`;
    });

    describe('when invoking', () => {
      it('dispatches GOAL_TITLE_SAVE_START', () => {
        goalTitleProvider.changeTitle(goalId, title);
        sinon.assert.calledWith(dispatchStub, { action: Actions.GOAL_TITLE_SAVE_START });
      });
    });

    describe('when getting a goal succeeds', () => {
      describe('when saving the title succeeds', () => {
        beforeEach(() => {
          server.respondWith('GET', url, [200, { 'Content-Type': 'application/json' }, '{"version": "version"}']);
          server.respondWith('PUT', url, [200, { 'Content-Type': 'application/json' }, '{}']);

          return goalTitleProvider.changeTitle(goalId, title);
        });

        it('dispatches GOAL_TITLE_SAVE_FINISH', () => {
          sinon.assert.calledWith(dispatchStub, {
            action: Actions.GOAL_TITLE_SAVE_FINISH,
            storyUid: goalId,
            title
          });
        });
      });

      describe('when saving the title fails', () => {
        beforeEach((done) => {
          server.respondWith('GET', url, [200, { 'Content-Type': 'application/json' }, '{"version": "version"}']);
          server.respondWith('PUT', url, [500, { 'Content-Type': 'application/json' }, '{}']);

          goalTitleProvider.changeTitle(goalId, title).catch(() => done());
        });

        it('dispatches GOAL_TITLE_SAVE_ERROR', () => {
          sinon.assert.calledWith(dispatchStub, {
            action: Actions.GOAL_TITLE_SAVE_ERROR
          });
        });
      });
    });

    describe('when getting a goal fails', () => {
      beforeEach((done) => {
        server.respondWith('GET', url, [500, { 'Content-Type': 'application/json' }, '{}']);
        goalTitleProvider.changeTitle(goalId, title).catch(() => done());
      });

      it('dispatches GOAL_TITLE_SAVE_ERROR', () => {
        sinon.assert.calledWith(dispatchStub, {
          action: Actions.GOAL_TITLE_SAVE_ERROR
        });
      });
    });
  });
});
