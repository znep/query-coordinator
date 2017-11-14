import { assert, expect } from 'chai';
import fetchMock from 'fetch-mock';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';

import * as Actions from 'actions';
import reducerCreator from 'reducers';

import { invitedUsers, initialState, usersResponse, rolesResponse } from './helpers/stateFixtures';

describe('reducers', () => {

  describe('changeUserRole', () => {
    it('changes the user role when the call returns successfully', (done) => {
      const mockStore = configureStore([thunk]);
      const store = mockStore(initialState);

      fetchMock.put('/api/roles/5/users/cr53-8rh5', {});

      store.dispatch(Actions.changeUserRole('cr53-8rh5', '5')).
        then(() => {
          const actions = store.getActions();
          expect(actions).to.have.length(3);
          actions.slice(0,2).forEach((action) => expect(action.type).to.equal(Actions.USER_ROLE_CHANGE));
          expect(actions[0].stage).to.equal(Actions.START);
          expect(actions[1].stage).to.equal(Actions.COMPLETE_SUCCESS);
          expect(actions[2].type).to.equal(Actions.SHOW_NOTIFICATION);
          done();
        }).
        catch(err => {
          done(err);
        });
    });
  });

  describe('loadData', () => {
    it('loads data and populates the store', (done) => {
      const mockStore = configureStore([thunk]);
      const store = mockStore({ users: [], roles: []});

      fetchMock.get('/api/catalog/v1/users?domain=localhost&limit=10000&order=screen_name', usersResponse);
      fetchMock.get('/api/future_accounts', invitedUsers);
      fetchMock.get('/api/roles', rolesResponse);

      store
        .dispatch(Actions.loadData())
        .then(() => {
          const actions = store.getActions();
          expect(actions).to.have.length(2);
          actions.forEach((action) => expect(action.type).to.equal(Actions.LOAD_DATA));
          expect(actions[0].stage).to.equal(Actions.START);
          expect(actions[1].stage).to.equal(Actions.COMPLETE_SUCCESS);
          expect(actions[1].roles).to.be.an('array');
          expect(actions[1].users).to.be.an('array');
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('userSearch', () => {
    it('searches for users when passed a query', (done) => {
      const mockStore = configureStore([thunk]);
      const store = mockStore({ users: [], roles: [] });

      const query = 'asdf';
      fetchMock.get(`/api/catalog/v1/users?domain=localhost&limit=10000&q=${query}`, usersResponse);

      store
        .dispatch(Actions.userSearch(query))
        .then(() => {
          const actions = store.getActions();
          expect(actions).to.have.length(2);
          actions.forEach((action) => expect(action.type).to.equal(Actions.USER_SEARCH));
          expect(actions[0].stage).to.equal(Actions.START);
          expect(actions[1].stage).to.equal(Actions.COMPLETE_SUCCESS);
          expect(actions[1].users).to.be.an('array');
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('ui', () => {
    it('toggles the add user UI on', () => {
      const reducer = reducerCreator(null, null);
      const newState = reducer({ ui: { showAddUserUi: false }}, Actions.toggleAddUserUi(true));
      expect(newState.ui.showAddUserUi).to.eql(true);
    });

    it('toggles the add user UI off', () => {
      const reducer = reducerCreator(null, null);
      const newState = reducer({ ui: { showAddUserUi: true }}, Actions.toggleAddUserUi(false));
      expect(newState.ui.showAddUserUi).to.eql(false);
    });

    it('set errors', () => {
      const reducer = reducerCreator(null, null);
      const newState = reducer({ ui: { addUserErrors: [] }}, Actions.setAddUserErrors(['error']));
      expect(newState.ui.addUserErrors).to.eql(['error']);
    });

    it('clear errors', () => {
      const reducer = reducerCreator(null, null);
      const newState = reducer({ ui: { addUserErrors: ['error'] }}, Actions.clearAddUserErrors());
      expect(newState.ui.addUserErrors).to.eql([]);
    });
  });
});
