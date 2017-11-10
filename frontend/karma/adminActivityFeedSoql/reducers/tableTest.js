import { assert } from 'chai';
import * as tableActions from 'actions/table';
import tableReducer from 'reducers/table';
import * as mockData from '../data/mockFetchTable';

describe('table reducer', () => {

  it('should be able to store table data', () => {
    const newState = tableReducer({}, tableActions.storeData(mockData.data1));
    assert.equal(newState.data, mockData.data1);
  });

});
