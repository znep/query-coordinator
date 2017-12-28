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

  describe('SAVE_START', () => {
    it('sets saving=true and clears previous save status', () => {
      state.saving = false;
      state.saveError = true;
      state.showSaveToastMessage = true;

      state = reducer(state, actions.view.saveStart());

      assert.propertyVal(state, 'saving', true);
      assert.propertyVal(state, 'saveError', false);
      assert.propertyVal(state, 'showSaveToastMessage', false);
    });
  });

  describe('SAVE_COMPLETE', () => {
    describe('on error', () => {
      it('sets isDirty to true, saving to false, saveError to true, and showSaveToastMessage to true', () => {
        state = reducer(state, actions.view.saveComplete(new Error()));

        assert.propertyVal(state, 'saving', false);
        assert.propertyVal(state, 'saveError', true);
        assert.propertyVal(state, 'showSaveToastMessage', true);
      });
    });

    describe('on success', () => {
      it('sets isDirty, saving, and saveError to false, and showSaveToastMessage to true', () => {
        state = reducer(state, actions.view.saveComplete());

        assert.propertyVal(state, 'saving', false);
        assert.propertyVal(state, 'saveError', false);
        assert.propertyVal(state, 'showSaveToastMessage', true);
      });
    });
  });

  describe('CLEAR_SAVE_TOAST', () => {
    it('sets showSaveToastMessage to false', () => {
      state.showSaveToastMessage = true;

      state = reducer(state, actions.view.clearSaveToast());

      assert.propertyVal(state, 'showSaveToastMessage', false);
    });
  });


  // Note: This is a thunk action - we test the non-thunk parts here.
  // The thunk is tested in actionsTest.js.
  describe('ACCEPT_EDIT_MODAL_CHANGES', () => {
    it('overwrites the measure, coreView, and marks the measure as dirty', () => {
      state.isDirty = false;
      state.measure = 'a measure object';
      state.coreView = 'a view object';

      state = reducer(state, {
        type: actions.editor.ACCEPT_EDIT_MODAL_CHANGES,
        measure: 'a different measure object',
        coreView: 'a different view object'
      });

      assert.isTrue(state.isDirty);
      assert.equal(state.measure, 'a different measure object');
      assert.equal(state.coreView, 'a different view object');
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
