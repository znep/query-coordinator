import { assert } from 'chai';

import { ModeStates } from 'lib/constants';
import reducer from 'reducers/view';
import actions from 'actions';

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

      state = reducer(state, actions.view.setActivePane('metadata'));

      assert.equal(state.activePane, 'metadata');
    });
  });

  // Note: This is a thunk action - we test the non-thunk parts here.
  // The thunk is tested in actionsTest.js.
  describe('ACCEPT_EDIT_MODAL_CHANGES', () => {
    it('overwrites the measure and marks it as dirty', () => {
      assert.isFalse(state.isDirty);
      assert.equal(state.measure, 'a measure object');

      state = reducer(state, {
        type: actions.editor.ACCEPT_EDIT_MODAL_CHANGES,
        measure: 'a different measure object'
      });

      assert.isTrue(state.isDirty);
      assert.equal(state.measure, 'a different measure object');
    });
  });

  describe('ENTER_EDIT_MODE', () => {
    it('sets mode to "EDIT"', () => {
      const state = reducer(state, actions.view.enterEditMode());
      assert.equal(state.mode, ModeStates.EDIT);
    });
  });

  describe('ENTER_PREVIEW_MODE', () => {
    it('sets mode to "PREVIEW"', () => {
      const state = reducer(state, actions.view.enterPreviewMode());
      assert.equal(state.mode, ModeStates.PREVIEW);
    });
  });
});
