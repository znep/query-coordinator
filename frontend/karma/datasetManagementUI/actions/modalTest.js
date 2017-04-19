import { assert } from 'chai';
import { SHOW_MODAL, showModal, HIDE_MODAL, hideModal } from 'actions/modal';

describe('actions/modal', () => {
  describe('actions/modal/hideModal', () => {
    const action = hideModal();

    const expectedAction = {
      type: HIDE_MODAL
    };

    it('returns an action of the correct shape', () => {
      assert.deepEqual(action, expectedAction);
    });
  });

  describe('actions/modal/showModal', () => {
    const action = showModal('TestComponent');

    const expectedAction = {
      type: SHOW_MODAL,
      contentComponentName: 'TestComponent'
    };

    it('returns an action of the correct shape', () => {
      assert.deepEqual(action, expectedAction);
    });
  });
});
