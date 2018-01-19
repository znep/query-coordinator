import { assert } from 'chai';
import historyReducer from 'datasetManagementUI/reduxStuff/reducers/history';
import { addLocation } from 'datasetManagementUI/reduxStuff/actions/history';

describe('history reducer', () => {
  it('returns an empty array as its default state', () => {
    const state = historyReducer(undefined, {});

    assert.deepEqual(state, []);
  });

  it('appends the location to the state on ADD_LOCATION', () => {
    const appendedLocation = { pathname: '/dataset/1' };
    const state = historyReducer(undefined, addLocation(appendedLocation));
    assert.deepEqual(state[state.length - 1], appendedLocation);
  });
});
