import { assert, expect } from 'chai';
import fetchMock from 'fetch-mock';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';

import { loadData, LOAD_DATA, START, COMPLETE_SUCCESS } from 'actions';
import { toggleAddUserUi, setAddUserErrors, clearAddUserErrors } from 'users/actions';
import reducerCreator from 'reducers';

import { invitedUsers, usersResponse, rolesResponse } from './helpers/stateFixtures';

describe('reducers', () => {

  describe('loadData', () => {
    it('loads data and populates the store', (done) => {
      const mockStore = configureStore([thunk]);
      const store = mockStore({ users: [], roles: []});

      fetchMock.get('/api/catalog/v1/users?domain=localhost&limit=10000&order=screen_name', usersResponse);
      fetchMock.get('/api/future_accounts', invitedUsers);
      fetchMock.get('/api/roles', rolesResponse);

      store
        .dispatch(loadData())
        .then(() => {
          const actions = store.getActions();
          expect(actions).to.have.length(2);
          actions.forEach((action) => expect(action.type).to.equal(LOAD_DATA));
          expect(actions[0].stage).to.equal(START);
          expect(actions[1].stage).to.equal(COMPLETE_SUCCESS);
          expect(actions[1].roles).to.be.an('array');
          expect(actions[1].users).to.be.an('array');
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('ui', () => {
    it('toggles the add user UI on', () => {
      const reducer = reducerCreator(null, null);
      const newState = reducer({ ui: { showAddUserUi: false }}, toggleAddUserUi(true));
      expect(newState.ui.showAddUserUi).to.eql(true);
    });

    it('toggles the add user UI off', () => {
      const reducer = reducerCreator(null, null);
      const newState = reducer({ ui: { showAddUserUi: true }}, toggleAddUserUi(false));
      expect(newState.ui.showAddUserUi).to.eql(false);
    });

    it('set errors', () => {
      const reducer = reducerCreator(null, null);
      const newState = reducer({ ui: { addUserErrors: [] }}, setAddUserErrors(['error']));
      expect(newState.ui.addUserErrors).to.eql(['error']);
    });

    it('clear errors', () => {
      const reducer = reducerCreator(null, null);
      const newState = reducer({ ui: { addUserErrors: ['error'] }}, clearAddUserErrors());
      expect(newState.ui.addUserErrors).to.eql([]);
    });
  });
});
