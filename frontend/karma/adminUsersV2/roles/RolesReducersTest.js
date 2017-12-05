import { assert, expect } from 'chai';
import fetchMock from 'fetch-mock';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';

import { COMPLETE_SUCCESS, SHOW_NOTIFICATION, START } from 'actions';
import { userSearch } from 'users/actions';
import { changeUserRole, USER_ROLE_CHANGE } from 'roles/actions';

import { initialState } from '../helpers/stateFixtures';

describe('roles/reducers', () => {

  describe('changeUserRole', () => {
    it('changes the user role when the call returns successfully', (done) => {
      const mockStore = configureStore([thunk]);
      const store = mockStore(initialState);

      fetchMock.put('/api/roles/5/users/cr53-8rh5', {});

      store.dispatch(changeUserRole('cr53-8rh5', '5')).
      then(() => {
        const actions = store.getActions();
        expect(actions).to.have.length(3);
        actions.slice(0,2).forEach((action) => expect(action.type).to.equal(USER_ROLE_CHANGE));
        expect(actions[0].stage).to.equal(START);
        expect(actions[1].stage).to.equal(COMPLETE_SUCCESS);
        expect(actions[2].type).to.equal(SHOW_NOTIFICATION);
        done();
      }).
      catch(err => {
        done(err);
      });
    });
  });

});
