import { expect, assert } from 'chai';
import readyToImport, { initialState } from 'reducers/readyToImport';
import { nextHelpItem, previousHelpItem, openHelpModal, closeHelpModal } from 'actions/readyToImport';

describe('reducers/readyToImport', () => {
  it('returns expected default state', () => {
    const state = readyToImport(undefined, {});
    expect(_.isEqual(state, initialState)).to.eq(true);
  });

  it('responds correctly to OPEN_HELP_MODAL', () => {
    const state = readyToImport(initialState, openHelpModal());
    expect(state.modalVisible).to.eql(true);
  });

  it('responds correctly to NEXT_HELP_ITEM', () => {
    const state = readyToImport(readyToImport(initialState, openHelpModal()), nextHelpItem());
    expect(state.modalVisible).to.eql(true);
    expect(state.modalIndex).to.eql(1);
  });

  it('responds correctly to PREVIOUS_HELP_ITEM', () => {
    var state = readyToImport(initialState, openHelpModal());
    state = readyToImport(state, nextHelpItem())
    state = readyToImport(state, previousHelpItem())

    expect(state.modalVisible).to.eql(true);
    expect(state.modalIndex).to.eql(0);
  });

  it('is no longer visible when we advance past the end', () => {
    var state = readyToImport(initialState, openHelpModal());
    state = readyToImport(state, nextHelpItem());
    state = readyToImport(state, nextHelpItem());
    state = readyToImport(state, nextHelpItem());

    expect(state.modalVisible).to.eql(false);
  });

  it('can close the modal', () => {
    var state = readyToImport(initialState, openHelpModal());
    state = readyToImport(state, closeHelpModal());
    expect(state.modalVisible).to.eql(false);
  });
});
