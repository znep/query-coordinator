import { assert } from 'chai';

import reducer from 'reducers/editor';
import * as actions from 'actions/editor';

const INITIAL_STATE = Object.freeze({
  isEditing: false,
  measure: {},
  pristineMeasure: {}
});

describe('Edit modal reducer', () => {
  let state;

  beforeEach(() => {
    state = reducer(_.cloneDeep(INITIAL_STATE));
  });

  afterEach(() => {
    state = undefined;
  });

  describe('SET_ANALYSIS', () => {
    it('updates the analysis description in the measure metadata', () => {
      assert.isUndefined(_.get(state.measure), 'metadata.analysis');

      state = reducer(state, actions.setAnalysis('Some analysis text'));

      assert.equal(state.measure.metadata.analysis, 'Some analysis text');
    });
  });

  describe('SET_METHODS', () => {
    it('updates the methods description in the measure metadata', () => {
      assert.isUndefined(_.get(state.measure), 'metadata.methods');

      state = reducer(state, actions.setMethods('Some methods text'));

      assert.equal(state.measure.metadata.methods, 'Some methods text');
    });
  });

  describe('CLONE_MEASURE', () => {
    it('sets the measure under editing and a pristine copy', () => {
      assert.deepEqual({}, state.measure);
      assert.deepEqual({}, state.pristineMeasure);

      state = reducer(state, actions.cloneMeasure('a measure object'));

      assert.equal(state.measure, 'a measure object');
      assert.equal(state.pristineMeasure, 'a measure object');
    });
  });

  describe('OPEN_EDIT_MODAL', () => {
    it('sets the editing state to true', () => {
      assert.isFalse(state.isEditing);

      state = reducer(state, actions.openEditModal());

      assert.isTrue(state.isEditing);
    });
  });

  describe('CLOSE_EDIT_MODAL', () => {
    it('sets the editing state to false', () => {
      state = reducer(_.defaults({ isEditing: true }, INITIAL_STATE));

      assert.isTrue(state.isEditing);

      state = reducer(state, actions.closeEditModal());

      assert.isFalse(state.isEditing);
    });
  });
});
