import sinon from 'sinon';
import { expect, assert } from 'chai';
import { getDefaultStore } from 'testStore';
import * as http from 'common/http';
import reducer from 'reducers/catalog';
import * as Actions from 'actions/catalog';
import mockCeteraResponse from 'data/mockCeteraResponse';

describe('reducers/catalog', () => {
  let state;

  beforeEach(() => {
    state = reducer();
  });

  describe('UPDATE_CATALOG_RESULTS', () => {
    it('updates the catalog results array and resultSetSize', () => {
      state.results = [];
      state.resultSetSize = 0;
      state = reducer(state, Actions.updateCatalogResults(mockCeteraResponse));
      assert.lengthOf(state.results, 6);
      assert.equal(state.resultSetSize, 6);
    });
  });
});
