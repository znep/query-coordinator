import { assert } from 'chai';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { updateRevision } from 'actions/applyRevision';
import state from '../data/stateWithRevision';
import mockAPI from '../testHelpers/mockAPI';

const mockStore = configureStore([thunk]);

describe('actions/applyRevision/updateRevision', () => {
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
