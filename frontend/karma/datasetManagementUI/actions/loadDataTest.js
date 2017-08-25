import { assert } from 'chai';
import React from 'react';
import { needToLoadAnything, loadNormalPreview } from 'reduxStuff/actions/loadData';
import state from '../data/stateWithRevision';
import * as DisplayState from 'lib/displayState';
import mockAPI from '../testHelpers/mockAPI';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import _ from 'lodash';

const mockStore = configureStore([thunk]);

describe('loadData actions', () => {
  describe('needToLoadAnything', () => {
    it('DisplayState.NORMAL returns true when not loaded', () => {
      const displayState = DisplayState.normal(
        2,
        Number(Object.keys(state.entities.output_schemas)[0])
      );

      const result = needToLoadAnything(
        state.entities,
        state.ui.apiCalls,
        displayState
      );

      assert.equal(result, true);
    });

    it('DisplayState.ROW_ERRORS returns true when no matching API call', () => {
      const displayState = DisplayState.rowErrors(
        2,
        Number(Object.keys(state.entities.output_schemas)[0])
      );

      const result = needToLoadAnything(
        state.entities,
        state.ui.apiCalls,
        displayState
      );

      assert.equal(result, true);
    });

    it('DisplayState.COLUMN_ERRORS returns true when no matching API call', () => {
      const displayState = DisplayState.columnErrors(
        Number(Object.keys(state.entities.transforms)[0]),
        2,
        Number(Object.keys(state.entities.output_schemas)[0])
      );

      const result = needToLoadAnything(
        state.entities,
        state.ui.apiCalls,
        displayState
      );

      assert.equal(result, true);
    });

    it('returns false when loaded', () => {
      const displayState = DisplayState.normal(
        1,
        Number(Object.keys(state.entities.output_schemas)[0])
      );

      const result = needToLoadAnything(
        state.entities,
        state.ui.apiCalls,
        displayState
      );

      assert.equal(result, false);
    });
  });

  describe('loadNormalPreview', () => {
    let unmock;
    let fakeStore;

    before(() => {
      unmock = mockAPI();
      fakeStore = mockStore(state);
    });

    after(() => {
      unmock();
    });

    it('dispatches correct api call and table updates', done => {
      const apiCall = {
        operation: 'LOAD_ROWS',
        callParams: {
          displayState: DisplayState.normal(
            2,
            Number(Object.keys(state.entities.output_schemas)[0])
          )
        }
      };

      fakeStore
        .dispatch(loadNormalPreview(apiCall))
        .then(() => {
          const actions = fakeStore.getActions();

          const apiCall = actions.filter(
            action =>
              action.type === 'API_CALL_STARTED' &&
              action.operation === 'LOAD_ROWS'
          );

          const tableUpdates = actions.filter(
            action =>
              action.type === 'LOAD_NORMAL_PREVIEW_SUCCESS' &&
              _.has(action, 'colData') &&
              _.has(action, 'rowErrors')
          );

          assert.equal(apiCall.length, 1);
          assert.equal(tableUpdates.length, 1);
          done();
        })
        .catch(err => done(err));
    });
  });
});
