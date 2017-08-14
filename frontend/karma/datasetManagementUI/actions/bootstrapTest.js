import _ from 'lodash';
import { assert } from 'chai';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import state from '../data/stateWithRevision';
import mockAPI from '../testHelpers/mockAPI';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';
import { bootstrapApp } from 'reduxStuff/actions/bootstrap';

// create the mock socket and insert it into the fake store
const socket = mockSocket(bootstrapChannels);

const mockStore = configureStore([thunk.withExtraArgument(socket)]);

describe('bootstrap actions', () => {
  let unmockHTTP;
  let fakeStore;

  beforeEach(() => {
    fakeStore = mockStore(state);
  });

  before(() => {
    unmockHTTP = mockAPI();
  });

  after(() => {
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
      assert.deepEqual(actionTypes, [
        'BOOTSTRAP_APP_SUCCESS',
        'INSERT_INPUT_SCHEMA',
        'EDIT_INPUT_SCHEMA',
        'LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS',
        'EDIT_OUTPUT_SCHEMA',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'EDIT_TRANSFORM',
        'SHOW_MODAL',
        'POLL_FOR_TASK_SET_PROGRESS_SUCCESS'
      ]);
      done();
    }, 200);
  });
});
