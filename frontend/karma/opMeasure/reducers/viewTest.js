import { assert } from 'chai';

import reducer from 'reducers/view';
import * as actions from 'actions/view';

const INITIAL_STATE = Object.freeze({
  activePane: 'summary',
  isDirty: false,
  measure: 'a measure object'
});

describe('View reducer', () => {
  let state;

  beforeEach(() => {
    state = reducer(_.cloneDeep(INITIAL_STATE));
  });

  afterEach(() => {
    state = undefined;
  });

  describe('SET_ACTIVE_PANE', () => {
    it('sets the active pane by name', () => {
      assert.equal(state.activePane, 'summary');

      state = reducer(state, actions.setActivePane('metadata'));

      assert.equal(state.activePane, 'metadata');
    });
  });

  describe('UPDATE_MEASURE', () => {
    it('overwrites the measure and marks it as dirty', () => {
      assert.isFalse(state.isDirty);
      assert.equal(state.measure, 'a measure object');

      state = reducer(state, actions.updateMeasure('a different measure object'));

      assert.isTrue(state.isDirty);
      assert.equal(state.measure, 'a different measure object');
    });
  });
});
