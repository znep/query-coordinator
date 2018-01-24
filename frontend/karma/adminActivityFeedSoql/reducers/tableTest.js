import { assert } from 'chai';
import * as tableActions from 'adminActivityFeedSoql/actions/table';
import tableReducer from 'adminActivityFeedSoql/reducers/table';
import mockData from '../data/mockFetchTable';

describe('table reducer', () => {

  it('should be able to store table data', () => {
    const newState = tableReducer({}, tableActions.storeData(mockData));
    assert.equal(newState.data, mockData);
  });

});
