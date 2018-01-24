import _ from 'lodash';
import { assert } from 'chai';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import {
  applyRevision,
  updatePermission
} from 'datasetManagementUI/reduxStuff/actions/applyRevision';
import state from '../data/stateWithRevision';
import fetchMock from 'fetch-mock';
import * as dsmapiLinks from 'datasetManagementUI/links/dsmapiLinks';
import * as coreLinks from 'datasetManagementUI/links/coreLinks';

const mockStore = configureStore([thunk]);

const API_RESPONSES = {
  updateRevision: {
    resource: {
      id: 1,
      action: {
        permission: 'public'
      },
      created_at: '2017-10-03T16:14:01.869151Z'
    }
  },
  applyRevision: {
    resource: {
      id: 2,
      task_sets: [
        {
          updated_at: '2017-10-03T16:14:01.869151Z',
          status: 'successful',
          output_schema_id: 874,
          id: 145,
          finished_at: '2017-10-03T16:14:01',
          created_by: {
            user_id: 'tugg-ikce',
            email: 'brandon.webster@socrata.com',
            display_name: 'Brandon Webster'
          },
          created_at: '2017-10-03T16:14:00.392877Z'
        }
      ]
    }
  },
  getView: {
    columns: [],
    dispayType: 'table'
  }
};

describe('applyRevision actions', () => {
  let fakeStore;

  const params = {
    fourfour: 'ww72-hpm3',
    revisionSeq: '0'
  };

  beforeEach(() => {
    fakeStore = mockStore(state);
  });

  before(() => {
    fetchMock.put(dsmapiLinks.revisionBase(params), {
      body: JSON.stringify(API_RESPONSES.updateRevision),
      status: 200,
      statusText: 'OK'
    });

    fetchMock.put(dsmapiLinks.applyRevision(params), {
      body: JSON.stringify(API_RESPONSES.applyRevision),
      status: 200,
      statusText: 'OK'
    });

    fetchMock.get(dsmapiLinks.revisionBase(params), {
      body: JSON.stringify(API_RESPONSES.applyRevision),
      status: 200,
      statusText: 'OK'
    });

    fetchMock.get(coreLinks.view(params.fourfour), {
      body: JSON.stringify(API_RESPONSES.getView),
      status: 200,
      statusText: 'OK'
    });
  });

  after(() => {
    fetchMock.restore();
  });

  describe('updatePermission', () => {
    it('launches an UPDATE_REVISION api call', done => {
      fakeStore
        .dispatch(updatePermission('private', params))
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
        .dispatch(updatePermission('private', params))
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
      fakeStore.dispatch(updatePermission('public', params));
      assert.equal(fakeStore.getActions().length, 0);
    });
  });

  describe('applyRevision', () => {
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
