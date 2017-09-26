import { assert, expect } from 'chai';
import fetchMock from 'fetch-mock';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';

import reducer from 'reducers';
import * as Actions from 'actions';

import { initialState } from './helpers/stateFixtures';

describe('reducers', () => {

  describe('changeUserRole', () => {
    it('changes the user role when the call returns successfully', (done) => {
      const mockStore = configureStore([thunk]);
      const store = mockStore(initialState);

      fetchMock.put('/api/roles/5/users/cr53-8rh5', {});

      store.dispatch(Actions.changeUserRole('cr53-8rh5', '5')).
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
