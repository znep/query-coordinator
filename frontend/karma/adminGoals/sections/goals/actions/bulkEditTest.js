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
const END_TIME = moment.utc().add(1, 'day').toISOString();

const GOALS = [
  {
    id: 'a',
    is_public: false,
    start: moment.utc().add(1, 'day').toISOString(),
    prevailing_measure: {},
    narrative: {
      created_at: 'a_created_at',
      created_by: 'a_created_by',
    }
  },
  {
    id: 'b',
    is_public: true,
    start: moment.utc().toISOString(),
    prevailing_measure: {},
    narrative: {
      created_at: 'b_created_at',
      created_by: 'b_created_by',
    }
  }
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

  describe('saveFinished', () => {
    const action = Actions.BulkEdit.saveFinished();
    it('is of the correct type', () => {
      assert.propertyVal(action, 'type', 'goals.bulkEdit.saveFinished');
    });
  });

  describe('saveProgressSuccess', () => {
    const action = Actions.BulkEdit.saveProgressSuccess();
    it('is of the correct type', () => {
      assert.propertyVal(action, 'type', 'goals.bulkEdit.saveProgressSuccess');
    });
  });

  describe('saveProgressError', () => {
    const fakeGoal = { foo: 4 };
    const action = Actions.BulkEdit.saveProgressError(fakeGoal);
    it('has type and action', () => {
      assert.propertyVal(action, 'type', 'goals.bulkEdit.saveProgressError');
      assert.propertyVal(action, 'data', fakeGoal);
    });
  });

  it('saveGoals should dispatch expected actions if everything goes well', () => {
    const responseData = {
      prevailing_measure: {
        start: START_TIME
      }
    };

    const updateData = {
      prevailing_measure: {
        end: END_TIME
      }
    };

    server.respondWith(/goals/, JSON.stringify(responseData));

    return store.dispatch(Actions.BulkEdit.saveGoals(GOALS, updateData)).then((success) => {
      const [ saveStart, update1, progressSuccess1, update2, progressSuccess2, saveFinished ] = store.getActions();

      assert.propertyVal(saveStart, 'type', Actions.BulkEdit.types.saveStart);
      assert.propertyVal(update1, 'type', Actions.Data.types.updateById);
      assert.propertyVal(update2, 'type', Actions.Data.types.updateById);
      assert.propertyVal(progressSuccess1, 'type', Actions.BulkEdit.types.saveProgressSuccess);
      assert.propertyVal(progressSuccess2, 'type', Actions.BulkEdit.types.saveProgressSuccess);

      assert.propertyVal(update1, 'goalId', 'a');
      assert.propertyVal(update1.data, 'narrative', GOALS[0].narrative);
      assert.deepNestedPropertyVal(update1.data, 'prevailing_measure.start', responseData.prevailing_measure.start);
      assert.propertyVal(update2, 'goalId', 'b');
      assert.propertyVal(update2.data, 'narrative', GOALS[1].narrative);
      assert.deepNestedPropertyVal(update2.data, 'prevailing_measure.start', responseData.prevailing_measure.start);

      assert.propertyVal(saveFinished, 'type', Actions.BulkEdit.types.saveFinished);

      assert.isTrue(success);
    });
  });

  it('dispatches error action on failure', () => {

    const updateData = {
      prevailing_measure: {
        end: END_TIME
      }
    };

    store = mockStore(initialState.setIn(['goals', 'bulkEdit', 'saveStatus', 'error'], true));

    server.respondWith(xhr => {
      xhr.respond();
    });

    return store.dispatch(Actions.BulkEdit.saveGoals(GOALS, updateData)).then((success) => {
      const [ saveStart, progressError1, progressError2, saveFinished ] = store.getActions();

      assert.propertyVal(saveStart, 'type', Actions.BulkEdit.types.saveStart);
      assert.propertyVal(progressError1, 'type', Actions.BulkEdit.types.saveProgressError);
      assert.deepNestedPropertyVal(progressError1, 'data.id', 'a');
      assert.propertyVal(progressError2, 'type', Actions.BulkEdit.types.saveProgressError);
      assert.deepNestedPropertyVal(progressError2, 'data.id', 'b');

      assert.propertyVal(saveFinished, 'type', Actions.BulkEdit.types.saveFinished);

      assert.isFalse(success);
    });
  });
});
