import { assert } from 'chai';
import navigateToView from 'lib/navigateToView';
import { ModeStates } from 'lib/constants';
import { enterEditMode, enterViewMode } from 'actions';
import { getStore } from '../testStore'
import sinon from 'sinon';

describe('navigateToView', () => {
  let store;
  let dispatchSpy;

  const beforeNavigateToView = (mode) => {
    beforeEach(() => {
      store = getStore({ mode });
      dispatchSpy = sinon.spy(store, 'dispatch');
      navigateToView(store)();
    });

    afterEach(() => {
      store = null;
      dispatchSpy = null;
    });
  };

  describe('isEditMode', () => {
    beforeNavigateToView(ModeStates.EDIT);

    it('dispatches the enterViewMode action', () => {
      assert(dispatchSpy.calledWith(enterViewMode()));
    })
  });

  describe('isViewMode', () => {
    beforeNavigateToView(ModeStates.VIEW);
    it('dispatches the enterEditMode action', () => {
      assert(dispatchSpy.calledWith(enterEditMode()));
    });
  });

  describe('isPreviewMode', () => {
    beforeNavigateToView(ModeStates.PREVIEW);
    it('does not dispatch a mode action', () => {
      assert(dispatchSpy.neverCalledWith(enterEditMode()));
      assert(dispatchSpy.neverCalledWith(enterViewMode()));
    });
  });

});
