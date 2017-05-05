import sinon from 'sinon';
import { expect, assert } from 'chai';
import { getDefaultStore } from 'testStore';
import * as http from 'common/http';
import reducer from 'reducers/catalog';
import * as Actions from 'actions/catalog';
import mockCeteraResults from 'data/mockCeteraResults';

describe('reducers/catalog', () => {
  let state;

  beforeEach(() => {
    state = reducer();
  });

  describe('UPDATE_CATALOG_RESULTS', () => {
    it('updates the catalog results with the provided array', () => {
      state.results = [];
      state = reducer(state, Actions.updateCatalogResults(mockCeteraResults));
      assert.lengthOf(state.results, 6);
    });
  });
});
