import { expect, assert } from 'chai';
import sinon from 'sinon';
import moment from 'moment';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';

import mockTranslations from '../../../mockTranslations';

import * as Actions from 'sections/goals/actions';
import * as SharedActions from 'sections/shared/actions';

const START_TIME = moment.utc().toISOString();

const GOALS = [
  { id: 'a', is_public: false, start: moment.utc().add(1, 'day').toISOString(), prevailing_measure: {} },
  { id: 'b', is_public: true, start: moment.utc().toISOString(), prevailing_measure: {} }
];

const mockStore = configureStore([thunk]);
const initialState = Immutable.fromJS({
  translations: mockTranslations,
  goals: {
    data: GOALS,
    bulkEdit: {
      visible: false,
      updateInProgress: false,
      message: {visible: false},
      goal: {}
    }
  }
});


describe('actions/bulkEditActions', () => {
  let store;
  let server;

  beforeEach(() => {
    store = mockStore(initialState);
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(() => {
    server.restore()
  });

  describe('saveStart', () => {
    const action = Actions.BulkEdit.saveStart();
    it('is of the correct type', () => {
      assert.propertyVal(action, 'type', 'goals.bulkEdit.saveStart');
    });
    it('includes analytics event', () => {
      assert.property(action, 'analyticsTrackEvent');
      assert.propertyVal(action.analyticsTrackEvent, 'eventName', 'Clicked Update on Bulk Edit');
    });
  });

  describe('saveSuccess', () => {
    const action = Actions.BulkEdit.saveSuccess(123);
    it('is of the correct type', () => {
      assert.propertyVal(action, 'type', 'goals.bulkEdit.saveSuccess');
    });
    it('includes count as data', () => {
      assert.property(action, 'data', 123);
    });
  });

  describe('saveError', () => {
    const action = Actions.BulkEdit.saveError();
    it('is of the correct type', () => {
      assert.propertyVal(action, 'type', 'goals.bulkEdit.saveError');
    });
  });

  it('updateMultipleGoals should update given goals', () => {
    server.respondWith(/goals/, JSON.stringify({ is_public: true, prevailing_measure: { start: START_TIME } }));
    server.respondWith(/goals/, JSON.stringify({ is_public: true, prevailing_measure: { start: START_TIME } }));

    return store.dispatch(Actions.BulkEdit.saveGoals(GOALS.map(goal => Immutable.fromJS(goal)), { is_public: true })).then(() => {
      const [ saveStart, updateGoals, saveSuccess, closeModal ] = store.getActions();

      expect(saveStart.type).to.eq(Actions.BulkEdit.types.saveStart);
      expect(updateGoals.type).to.eq(Actions.Data.types.updateAll);
      expect(saveSuccess.type).to.eq(Actions.BulkEdit.types.saveSuccess);
      expect(closeModal.type).to.eq(Actions.BulkEdit.types.closeModal);

      expect(updateGoals.goals[0].is_public).to.eq(true);
      expect(updateGoals.goals[1].is_public).to.eq(true);

      expect(updateGoals.goals[0].prevailing_measure.start).to.eq(START_TIME);
      expect(updateGoals.goals[1].prevailing_measure.start).to.eq(START_TIME);
    });
  });

  it('dispatches error action on failure', () => {
    server.respondWith(xhr => {
      xhr.respond();
    });

    return store.dispatch(Actions.BulkEdit.saveGoals(GOALS.map(goal => Immutable.fromJS(goal)), { is_public: true })).then(() => {
      const [ saveStart, saveError ] = store.getActions();

      expect(saveStart.type).to.eq(Actions.BulkEdit.types.saveStart);
      expect(saveError.type).to.eq(Actions.BulkEdit.types.saveError);
    });
  });
});
