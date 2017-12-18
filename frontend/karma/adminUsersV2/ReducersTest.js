import { assert, expect } from 'chai';
import fetchMock from 'fetch-mock';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';

import { loadData, LOAD_DATA, START, COMPLETE_SUCCESS } from 'actions';
import { toggleAddUserUi, setAddUserErrors, clearAddUserErrors } from 'users/actions';
import rootReducer from 'reducers';

import { invitedUsers, usersResponse, rolesResponse } from './helpers/stateFixtures';

describe('reducers', () => {

  describe('loadData', () => {
    it('loads data and populates the store', (done) => {
      const mockStore = configureStore([thunk]);
      const store = mockStore({ users: [], roles: [], config: { usersResultsLimit: 10000 } });

      fetchMock.get('/api/catalog/v1/users?domain=localhost&limit=10000&offset=0&order=screen_name+ASC', usersResponse);
      fetchMock.get('/api/future_accounts', invitedUsers);
      fetchMock.get('/api/roles', rolesResponse);

      store
        .dispatch(loadData())
        .then(() => {
          const actions = store.getActions();
          expect(actions).to.have.length(2);
          actions.forEach((action) => expect(action.type).to.equal(LOAD_DATA));
          const [ startAction, completeAction ] = actions;
          expect(startAction.stage).to.equal(START);
          expect(completeAction.stage).to.equal(COMPLETE_SUCCESS);
          expect(completeAction.roles).to.be.an('array');
          expect(completeAction.users).to.be.an('object');
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('ui', () => {
    it('toggles the add user UI on', () => {
      const newState = rootReducer({ ui: { showAddUserUi: false }}, toggleAddUserUi(true));
      expect(newState.ui.showAddUserUi).to.eql(true);
    });

    it('toggles the add user UI off', () => {
      const newState = rootReducer({ ui: { showAddUserUi: true }}, toggleAddUserUi(false));
      expect(newState.ui.showAddUserUi).to.eql(false);
    });

    it('set errors', () => {
      const newState = rootReducer({ ui: { addUserErrors: [] }}, setAddUserErrors(['error']));
      expect(newState.ui.addUserErrors).to.eql(['error']);
    });

    it('clear errors', () => {
      const newState = rootReducer({ ui: { addUserErrors: ['error'] }}, clearAddUserErrors());
      expect(newState.ui.addUserErrors).to.eql([]);
    });
  });
});
