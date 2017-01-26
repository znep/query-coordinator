import reducer from 'reducers/modal';
import {
  openAssetSelector,
  closeAssetSelector
} from 'actions/modal';

describe('reducers/modal', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('OPEN_ASSET_SELECTOR', function() {
    it('sets modalIsOpen to false', function() {
      state = reducer(state, openAssetSelector());
      expect(state.modalIsOpen).to.eq(true);
    });
  });

  describe('CLOSE_ASSET_SELECTOR', function() {
    it('sets modalIsOpen to false', function() {
      state = reducer(state, closeAssetSelector());
      expect(state.modalIsOpen).to.eq(false);
    });
  });
});
