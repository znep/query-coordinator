import { assert } from 'chai';
import * as paginationActions from 'adminActivityFeedSoql/actions/pagination';
import paginationReducer from 'adminActivityFeedSoql/reducers/pagination';

describe('pagination reducer', () => {

  it('should be able to total row count', () => {
    const newState = paginationReducer({}, paginationActions.storeRowCount(5));
    assert.equal(newState.rowCount, 5);
  });

});
