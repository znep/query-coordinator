import { assert } from 'chai';
import sinon from 'sinon';

import * as actions from 'visualizationCanvas/actions';
import * as generateFilterEventsModule from 'visualizationCanvas/lib/mixpanel/eventGenerators/filters';
import { middleware, __RewireAPI__ as middlewareAPI } from 'visualizationCanvas/lib/mixpanel/middleware';

describe('Mixpanel middleware', () => {
  let store;
  let next;
  let eventGeneratorStubs;

  beforeEach(() => {
    store = {
      dispatch: sinon.stub(),
      getState: sinon.stub().returns({})
    };

    next = sinon.stub().callsFake(({ type }) => `Received ${type}`);

    eventGeneratorStubs = {
      filters: sinon.stub()
    };
    middlewareAPI.__Rewire__('generateFilterEvents', eventGeneratorStubs.filters);
  });

  afterEach(() => {
    _.each(eventGeneratorStubs, (stub) => {
      if (_.isFunction(stub.restore)) {
        stub.restore();
      }
    });
  });

  // All actions should obey this behavior; otherwise, it means we're ending the
  // chain prematurely before reaching the store.
  const testYield = (type) => {
    describe(`when receiving action ${type}`, () => {
      it('yields to the next middleware', () => {
        const result = middleware(store)(next)({ type });

        sinon.assert.calledOnce(next);
        sinon.assert.calledWith(next, { type });
        assert.equal(result, `Received ${type}`);
      });
    });
  };

  _(actions).filter(_.isString).each(testYield);

  // These actions should have a 1:1 correspondence with the case statement in
  // the non-pristine path of the middleware.
  const testEmitOnTransientState = (fetchEventGenerators, type) => {
    describe(`when receiving dirtying action ${type}`, () => {
      it(`dispatches ${actions.EMIT_MIXPANEL_EVENT}`, () => {
        middleware(store)(next)({ type });

        sinon.assert.calledOnce(store.dispatch);
        sinon.assert.calledWith(store.dispatch, sinon.match({ type: actions.EMIT_MIXPANEL_EVENT }));
      });

      it('invokes the expected event generators', () => {
        middleware(store)(next)({ type });

        _.each(fetchEventGenerators(), (gen) => sinon.assert.calledOnce(gen));
      });
    });
  };

  const dirtyingActions = {
    [actions.SET_FILTERS]: () => [eventGeneratorStubs.filters]
  };

  _.each(dirtyingActions, testEmitOnTransientState);

  // In theory, we could test the pristine path behavior by targeting the action
  // HANDLE_SAVE_SUCCESS, but I'm trying to genericize behaviors when possible.
  describe(`when state is pristine`, () => {
    beforeEach(() => {
      store.getState.onSecondCall().returns({ isDirty: false });
    });

    it(`dispatches ${actions.EMIT_MIXPANEL_EVENT}`, () => {
      middleware(store)(next)({ type: 'TEST_SENTINEL_FOR_PRISTINE_STATE' });

      sinon.assert.calledOnce(store.dispatch);
      sinon.assert.calledWith(store.dispatch, sinon.match({ type: actions.EMIT_MIXPANEL_EVENT }));
    });

    it('invokes all pristine-aware event generators', () => {
      middleware(store)(next)({ type: 'TEST_SENTINEL_FOR_PRISTINE_STATE' });

      sinon.assert.calledOnce(eventGeneratorStubs.filters);
    });
  });

});
