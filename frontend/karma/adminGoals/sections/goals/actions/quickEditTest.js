import sinon from 'sinon';
import { expect, assert } from 'chai';
import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import mockGoalsById from '../../../data/cachedGoals';
import propGoals, { goalsWithPublicationState } from '../../../data/goalTableActions/propGoals';
import mockedTranslations from '../../../mockTranslations';
import { FeatureFlags } from 'common/feature_flags';

import * as Actions from 'adminGoals/sections/goals/actions';
import { EventNames } from 'adminGoals/sections/shared/analytics';

const mockGoals = Immutable.fromJS(mockGoalsById).valueSeq().toList().toJS();

describe('actions/quickEditActions', () => {
  let server;
  const mockStore = configureStore([thunk]);

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(() => {
    server.restore();
  });

  describe('saveStart', () => {
    const eventName = 'foobar';
    const action = Actions.QuickEdit.saveStart('goal-iddd', eventName);
    it('is of the correct type', () => {
      assert.propertyVal(action, 'type', 'goals.quickEdit.saveStart');
    });
    it('includes analytics event', () => {
      assert.property(action, 'analyticsTrackEvent');
      assert.propertyVal(action.analyticsTrackEvent.eventPayload, 'Goal Id', 'goal-iddd');
      assert.propertyVal(action.analyticsTrackEvent, 'eventName', eventName);
    });
  });

  describe('saveSuccess', () => {
    const action = Actions.QuickEdit.saveSuccess();
    it('is of the correct type', () => {
      assert.propertyVal(action, 'type', 'goals.quickEdit.saveSuccess');
    });
  });

  describe('saveError', () => {
    const action = Actions.QuickEdit.saveError({ some: 'error' });
    it('is of the correct type', () => {
      assert.propertyVal(action, 'type', 'goals.quickEdit.saveError');
    });
    it('includes error as data', () => {
      assert.propertyVal(action.data, 'some', 'error');
    });
  });

  it('openModal should send goalId to reducer', () => {
    const goalId = 'xxxx-xxxx';
    const returnValue = Actions.QuickEdit.openModal(goalId);
    expect(returnValue.type).to.eq(Actions.QuickEdit.types.openModal);
    expect(returnValue.goalId).to.eq(goalId);
  });

  it('closeModal should send goalId to reducer', () => {
    const returnValue = Actions.QuickEdit.closeModal();
    expect(returnValue).to.deep.eq({ type: Actions.QuickEdit.types.closeModal });
  });

  describe('save', () => {
    let store;
    let server;
    const goalId = 'vefh-4ihb';
    const initialState = Immutable.fromJS({
      translations: mockedTranslations,
      goals: {
        data: mockGoals,
        quickEdit: {
          goalId: goalId,
          message: {
            visible: false
          },
          initialFormData: {},
          formData: {}
        }
      }
    });

    beforeEach(() => {
      store = mockStore(initialState);
      server = sinon.fakeServer.create();
      server.autoRespond = true;
    });

    afterEach(() => {
      server.restore();
    });

    describe('making a goal public', () => {
      it('publishes first', () => {
        const draftGoalId = goalsWithPublicationState.publishedWithDraft.id;
        const state = initialState.mergeDeep({
          goals: {
            data: propGoals,
            quickEdit: {
              goalId: draftGoalId,
              formData: {
                visibility: 'public'
              },
              initialFormData: {
                visibility: 'private'
              }
            }
          }
        });
        const fakeGoalData = { version: 'fakeVersion' };
        server.respondWith(xhr => {
          xhr.respond(200, null, JSON.stringify(fakeGoalData));
        });

        store = mockStore(state);

        return store.dispatch(Actions.QuickEdit.save()).then(() => {
          assert.lengthOf(store.getActions(), 6);
          // Only test the first 3, the rest are covered elsewhere.
          const [ saveStart, updateById, saveSuccess ] = store.getActions();

          assert.propertyVal(saveStart, 'type', Actions.QuickEdit.types.saveStart);
          assert.property(saveStart, 'analyticsTrackEvent');
          assert.propertyVal(
            saveStart.analyticsTrackEvent,
            'eventName',
            EventNames.publishViaQuickEditVisibilityDropdown
          );
          assert.propertyVal(saveStart.analyticsTrackEvent.eventPayload, 'Goal Id', draftGoalId);
          assert.propertyVal(updateById, 'type', Actions.Data.types.updateById);
          assert.propertyVal(saveSuccess, 'type', Actions.QuickEdit.types.saveSuccess);

          assert.propertyVal(updateById, 'goalId', draftGoalId);
          assert.propertyVal(updateById.data, 'version', fakeGoalData.version);
        });
      });
    });

    it('updates goal', () => {
      server.respondWith(xhr => {
        xhr.respond(200, null, JSON.stringify({ version: 'YYYY-MM-DDTHH:MM:SS.SSS+00:00' }));
      });

      return store.dispatch(Actions.QuickEdit.save()).then(() => {
        assert.lengthOf(store.getActions(), 3);
        const [ saveStart, updateById, saveSuccess ] = store.getActions();

        assert.propertyVal(saveStart, 'type', Actions.QuickEdit.types.saveStart);
        assert.propertyVal(updateById, 'type', Actions.Data.types.updateById);
        assert.propertyVal(saveSuccess, 'type', Actions.QuickEdit.types.saveSuccess);

        assert.propertyVal(updateById, 'goalId', goalId);
      });
    });

    it('includes analytics event', () => {
      return store.dispatch(Actions.QuickEdit.save()).then(() => {
        const action = _.find(store.getActions(), { type: Actions.QuickEdit.types.saveStart });
        assert.property(action, 'analyticsTrackEvent');
        assert.propertyVal(action.analyticsTrackEvent.eventPayload, 'Goal Id', goalId);
        assert.propertyVal(action.analyticsTrackEvent, 'eventName', EventNames.clickUpdateOnQuickEdit);
      });
    });

    it('dispatches error action on failure', () => {
      server.respondWith(xhr => {
        xhr.respond();
      });

      return store.dispatch(Actions.QuickEdit.save()).then(() => {
        const [ saveStart, saveError ] = store.getActions();

        expect(saveStart.type).to.eq(Actions.QuickEdit.types.saveStart);
        expect(saveError.type).to.eq(Actions.QuickEdit.types.saveError);
      });
    });
  });

  describe('publishLatestDraft', () => {
    let store;
    let server;
    const goalId = goalsWithPublicationState.publishedWithDraft.id;
    const initialState = Immutable.fromJS({
      goals: {
        data: propGoals,
        quickEdit: {
          goalId: goalId
        }
      }
    });

    beforeEach(() => {
      store = mockStore(initialState);
      server = sinon.fakeServer.create();
      server.autoRespond = true;
    });

    afterEach(() => {
      server.restore();
    });

    it('dispatches expected actions on success', () => {
      server.respondWith(xhr => {
        xhr.respond(200, null, JSON.stringify({ digest: 'fake digest' }));
      });

      return store.dispatch(Actions.QuickEdit.publishLatestDraft()).then(() => {
        assert.lengthOf(store.getActions(), 3);
        const [ saveStart, updateById, saveSuccess ] = store.getActions();

        assert.propertyVal(saveStart, 'type', Actions.QuickEdit.types.saveStart);
        assert.propertyVal(updateById, 'type', Actions.Data.types.updateById);
        assert.propertyVal(saveSuccess, 'type', Actions.QuickEdit.types.saveSuccess);

        assert.propertyVal(updateById, 'goalId', goalId);
      });
    });

    it('publishes draft with correct digest', () => {
      server.respondWith(xhr => {
        xhr.respond(200, null, JSON.stringify({ digest: 'fake digest' }));
      });

      return store.dispatch(Actions.QuickEdit.publishLatestDraft()).then(() => {
        // 1- fetch latest draft
        // 2- publish draft
        // 3- fetch new version of goal
        assert.lengthOf(server.requests, 3);
        const narrativeFetchRequest = server.requests[0];
        const narrativePublishRequest = server.requests[1];
        const latestVersionFetchRequest = server.requests[2];
        assert.propertyVal(narrativeFetchRequest, 'method', 'GET');
        assert.propertyVal(narrativeFetchRequest, 'url', `/api/stat/v1/goals/${goalId}/narrative/drafts/latest`);
        assert.propertyVal(narrativePublishRequest, 'method', 'POST');
        assert.propertyVal(narrativePublishRequest, 'url', `/api/stat/v1/goals/${goalId}/narrative/published`);
        assert.propertyVal(narrativePublishRequest, 'requestBody', '{"digest":"fake digest"}');
        assert.propertyVal(latestVersionFetchRequest, 'method', 'GET');
        assert.propertyVal(latestVersionFetchRequest, 'url', `/api/stat/v1/goals/${goalId}`);
      });
    });

    it('includes analytics event', () => {
      return store.dispatch(Actions.QuickEdit.publishLatestDraft()).then(() => {
        const action = _.find(store.getActions(), { type: Actions.QuickEdit.types.saveStart });
        assert.property(action, 'analyticsTrackEvent');
        assert.propertyVal(action.analyticsTrackEvent.eventPayload, 'Goal Id', goalId);
        assert.propertyVal(action.analyticsTrackEvent, 'eventName', EventNames.clickPublishOnQuickEdit);
      });
    });

    it('dispatches error action on failure', () => {
      server.respondWith(xhr => {
        xhr.respond();
      });

      return store.dispatch(Actions.QuickEdit.publishLatestDraft()).then(() => {
        const [ saveStart, saveError ] = store.getActions();

        expect(saveStart.type).to.eq(Actions.QuickEdit.types.saveStart);
        expect(saveError.type).to.eq(Actions.QuickEdit.types.saveError);
      });
    });
  });
});
