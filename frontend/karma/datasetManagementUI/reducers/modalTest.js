import { assert } from 'chai';
import modal, { initialState } from 'reducers/modal';
import { showModal, hideModal } from 'actions/modal';

describe('reducers/modal', () => {
  it('returns the correct default state', () => {
    const state = modal(undefined, {});

    assert.deepEqual(state, initialState);
  });

  it('responds correctly to showModal', () => {
    const state = modal(undefined, showModal('TestComponent'));

    const expectedState = {
      visible: true,
      contentComponentName: 'TestComponent',
      payload: null
    };

    assert.deepEqual(state, expectedState);
  });

  it('responds correctly to hideModal', () => {
    const state = modal(undefined, hideModal());

    const expectedState = {
      visible: false,
      contentComponentName: null,
      payload: null
    };

    assert.deepEqual(state, expectedState);
  });
});
