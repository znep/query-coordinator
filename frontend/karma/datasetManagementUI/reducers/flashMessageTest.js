import { expect, assert } from 'chai';
import flashMessage, { initialState } from 'reducers/flashMessage';
import { hideFlashMessage, showFlashMessage, SHOW_FLASH_MESSAGE } from 'actions/flashMessage';

describe('reducers/flashMessage', () => {
  it('returns expected default state', () => {
    const state = flashMessage(undefined, {});

    expect(_.isEqual(state, initialState)).to.eq(true);
  });

  it('responds correctly to SHOW_FLASH_MESSAGE', () => {
    const state = flashMessage(initialState, {type: SHOW_FLASH_MESSAGE, kind: 'error', message: 'Something went wrong'});

    expect(state.kind).to.eq('error');

    expect(state.message).to.eq('Something went wrong');

    expect(state.visible).to.eq(true);
  });

  it('responds correctly to HIDE_FLASH_MESSAGE', () => {
    const openState = {
      message: 'A message',
      visible: true,
      kind: 'success'
    };

    const state = flashMessage(openState, hideFlashMessage());

    expect(state.visible).to.eq(false);
  });
});
