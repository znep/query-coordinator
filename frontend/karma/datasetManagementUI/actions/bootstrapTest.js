import _ from 'lodash';
import { assert } from 'chai';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import state from '../data/stateWithRevision';
import mockAPI from '../testHelpers/mockAPI';
import wsmock from '../testHelpers/mockSocket';
import { bootstrapApp } from 'actions/bootstrap';

const mockStore = configureStore([thunk]);

describe('bootstrap', () => {
  let unmockWS;
  let unmockHTTP;
  let fakeStore;

  beforeEach(() => {
    fakeStore = mockStore(state);
  });

  before(() => {
    unmockWS = wsmock();
    unmockHTTP = mockAPI();
  });

  after(() => {
    unmockWS.stop();
    unmockHTTP();
  });

  it('joins channels and starts polling when there are in-progress task sets', done => {
    const revisionWithTaskSet = {
      ...window.initialState.revision,
      task_sets: [
        {
          id: 52,
          status: 'upserting'
        }
      ]
    };
    fakeStore.dispatch(
      bootstrapApp(
        window.initialState.view,
        revisionWithTaskSet,
        window.initialState.customMetadataFieldsets
      )
    );
    // TODO: promise-ify bootstrapApp & sideEffectyStuff so we don't have to setTimeout here?
    setTimeout(() => {
      const actions = fakeStore.getActions();
      const actionTypes = _.map(actions, 'type');
      // why are there so many EDIT_TRANSORMs
      assert.deepEqual(actionTypes, [
        'BOOTSTRAP_APP_SUCCESS',
        'POLL_FOR_OUTPUT_SCHEMA_SUCCESS',
        'CHANNEL_JOIN_STARTED',
        'CHANNEL_JOIN_STARTED',
        'CHANNEL_JOIN_STARTED',
        'INSERT_INPUT_SCHEMA',
        'CHANNEL_JOIN_STARTED',
        'SHOW_MODAL',
        'POLL_FOR_TASK_SET_PROGRESS_SUCCESS',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'EDIT_INPUT_SCHEMA',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'EDIT_INPUT_SCHEMA',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'EDIT_INPUT_SCHEMA',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'EDIT_INPUT_SCHEMA',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM'
      ]);
      done();
    }, 200);
  });
});
