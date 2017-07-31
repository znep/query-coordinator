import { assert, expect } from 'chai';
import fetchMock from 'fetch-mock';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';

import reducer from 'reducers';
import * as Actions from 'actions';

import { initialState } from './helpers/stateFixtures';

describe('reducers', () => {

  describe('userSelection', () => {

      it('selects a user when one user is selected', () => {
        const newState = reducer(initialState, Actions.userSelection('cr53-8rh5', true));
        assert(newState.users.slice(-1)[0].isSelected);
      });

      it('selects all user when selectAll is called', () => {
        const newState = reducer(initialState, Actions.userSelection(null, true, true));
        newState.users.forEach((user) => {
          assert(user.isSelected);
        });
      });

      it('removes selectAll when one user is unselected', () => {
        let state = reducer(initialState, Actions.userSelection(null, true, true));
        state = reducer(state, Actions.userSelection('cr53-8rh5', false));
        assert.isFalse(state.selectAll);
        state.users.forEach((user) => {
          if(user.id == 'cr53-8rh5') {
            assert.isFalse(user.isSelected, `User ${user.id} should not be selected`);
          } else {
            assert(user.isSelected, `User ${user.id} should be selected`);
          }
        });
      });
  });

  describe('changeUserRole', () => {
    it('changes the user role when the call returns successfully', (done) => {
      const mockStore = configureStore([thunk]);
      const store = mockStore(initialState);

      fetchMock.put('/api/users?method=promote&name=cr53-8rh5&role=publisher', {
        "id": "cr53-8rh5",
        "screenName": "Test Viewer",
        "email": "test-viewer@test-socrata.com",
        "roleName": "viewer"
      });

      store.dispatch(Actions.changeUserRole('cr53-8rh5', 'publisher')).
        then(() => {
          const actions = store.getActions();
          expect(actions).to.have.length(2);
          actions.forEach((action) => expect(action.type).to.equal(Actions.USER_ROLE_CHANGE));
          expect(actions[0].stage).to.equal(Actions.START);
          expect(actions[1].stage).to.equal(Actions.COMPLETE_SUCCESS);
          done();
        }).
        catch(err => {
          done(err);
        });
    });
  });
});
