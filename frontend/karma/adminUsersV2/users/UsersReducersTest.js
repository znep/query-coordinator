import { assert, expect } from 'chai';
import fetchMock from 'fetch-mock';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';

import { COMPLETE_SUCCESS, START } from 'actions';
import { userSearch, USER_SEARCH } from 'users/actions';

import { usersResponse } from '../helpers/stateFixtures';

describe('users/reducers', () => {

  describe('userSearch', () => {
    it('searches for users when passed a query', (done) => {
      const mockStore = configureStore([thunk]);
      const store = mockStore({ users: [], roles: [] });

      const query = 'asdf';
      fetchMock.get(`/api/catalog/v1/users?domain=localhost&limit=10000&q=${query}`, usersResponse);

      store
        .dispatch(userSearch(query))
        .then(() => {
          const actions = store.getActions();
          expect(actions).to.have.length(2);
          actions.forEach((action) => expect(action.type).to.equal(USER_SEARCH));
          expect(actions[0].stage).to.equal(START);
          expect(actions[1].stage).to.equal(COMPLETE_SUCCESS);
          expect(actions[1].users).to.be.an('array');
          done();
        })
        .catch(err => done(err));
    });
  });

});
