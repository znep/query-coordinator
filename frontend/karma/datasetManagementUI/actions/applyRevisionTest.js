import _ from 'lodash';
import { assert } from 'chai';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { applyRevision, updateRevision } from 'reduxStuff/actions/applyRevision';
import state from '../data/stateWithRevision';
import mockAPI from '../testHelpers/mockAPI';

const mockStore = configureStore([thunk]);

describe('applyRevision actions', () => {
  let unmock;
  let fakeStore;

  beforeEach(() => {
    fakeStore = mockStore(state);
  });

  before(() => {
    unmock = mockAPI();
  });

  after(() => {
    unmock();
  });

  describe('updateRevision', () => {
    it('launches an UPDATE_REVISION api call', done => {
      fakeStore
        .dispatch(updateRevision('private'))
        .then(() => {
          const actions = fakeStore.getActions();
          const expectedAction = actions.filter(
            action => action.operation === 'UPDATE_REVISION'
          );
          assert.equal(expectedAction.length, 1);
          done();
        })
        .catch(err => done(err));
    });

    it('updates the revision with the correct permission if api call succeeds', () => {
      fakeStore
        .dispatch(updateRevision('private'))
        .then(() => {
          const actions = fakeStore.getActions();
          const expectedAction = actions.filter(
            action => action.operation === 'EDIT_REVISION'
          );
          assert.equal(expectedAction[0].payload.permission, 'private');
          done();
        })
        .catch(err => done(err));
    });

    it('does nothing if attempting to set permission to same as current permission', () => {
      fakeStore.dispatch(updateRevision('public'));
      assert.equal(fakeStore.getActions().length, 0);
    });
  });

  describe('applyRevision', () => {
    const params = {
      category: 'dataset',
      name: 'mm',
      fourfour: 'kp42-jdvd',
      revisionSeq: '0'
    };

    it('works when an output schema is supplied', done => {
      fakeStore
        .dispatch(applyRevision(params))
        .then(() => {
          const actions = fakeStore.getActions();
          assert.deepEqual(_.map(actions, 'type'), [
            'API_CALL_STARTED',
            'API_CALL_SUCCEEDED',
            'ADD_TASK_SET',
            'SHOW_MODAL'
          ]);
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('works without an output schema (no-file case)', done => {
      fakeStore
        .dispatch(applyRevision(params))
        .then(() => {
          const actions = fakeStore.getActions();
          assert.deepEqual(_.map(actions, 'type'), [
            'API_CALL_STARTED',
            'API_CALL_SUCCEEDED',
            'ADD_TASK_SET',
            'SHOW_MODAL'
          ]);
          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });
});
