import _ from 'lodash';
import { assert } from 'chai';
import configureStore from 'redux-mock-store';
import { bootstrapApp } from 'reduxStuff/actions/bootstrap';

describe('bootstrap', () => {

  it('joins channels and starts polling when there are in-progress task sets', () => {
    const mockStore = configureStore();
    const fakeStore = mockStore();

    fakeStore.dispatch(
      bootstrapApp(
        window.initialState.view,
        window.initialState.customMetadataFieldsets
      )
    );
    const actions = fakeStore.getActions();
    const actionTypes = _.map(actions, 'type');
    assert.deepEqual(actionTypes, [
      'BOOTSTRAP_APP'
    ]);
  });
});
