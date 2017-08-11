import { assert } from 'chai';
import { ADD_LOCATION, addLocation } from 'actions/history';

describe('actions/history', () => {
  const location = {
    pathname: '/dataset/traffic/1234-abcd/0'
  };
  it('dispatches as action of the correct type', () => {
    const action = addLocation(location);

    assert.equal(action.type, ADD_LOCATION);
  });

  it('dispatches an action with the correct payload', () => {
    const action = addLocation(location);

    assert.deepEqual(action.location, location);
  });
});
