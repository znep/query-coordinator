import _ from 'lodash';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
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

  describe('FETCH_RESULTS', () => {
    it('sets fetchingResults to true and fetchingResultsError to false', () => {
      state.fetchingResults = false;
      state.fetchingResultsError = true;
      state = reducer(state, Actions.fetchingResults());
      assert.isTrue(state.fetchingResults);
      assert.isFalse(state.fetchingResultsError);
    });
  });

  describe('FETCH_RESULTS_SUCCESS', () => {
    it('sets fetchingResults to false and fetchingResultsError to false', () => {
      state.fetchingResults = true;
      state.fetchingResultsError = true;
      state = reducer(state, Actions.fetchingResultsSuccess());
      assert.isFalse(state.fetchingResults);
      assert.isFalse(state.fetchingResultsError);
    });
  });

  describe('FETCH_RESULTS_ERROR', () => {
    it('sets fetchingResults to false and fetchingResultsError to true', () => {
      state.fetchingResults = true;
      state.fetchingResultsError = false;
      state = reducer(state, Actions.fetchingResultsError());
      assert.isFalse(state.fetchingResults);
      assert.isTrue(state.fetchingResultsError);
    });
  });
});