import { assert } from 'chai';
import { SHOW_MODAL, showModal, HIDE_MODAL, hideModal } from 'datasetManagementUI/reduxStuff/actions/modal';

describe('modal actions', () => {
  describe('hideModal', () => {
    const action = hideModal();

    const expectedAction = {
      type: HIDE_MODAL
    };

    it('returns an action of the correct shape', () => {
      assert.deepEqual(action, expectedAction);
    });
  });

  describe('showModal', () => {
    const action = showModal('TestComponent');

    const expectedAction = {
      type: SHOW_MODAL,
      contentComponentName: 'TestComponent',
      payload: null
    };

    it('returns an action of the correct shape', () => {
      assert.deepEqual(action, expectedAction);
    });
  });
});
