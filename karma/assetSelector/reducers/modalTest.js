import reducer from 'reducers/modal';
import { closeModal } from 'actions/modal';

describe('reducers/modal', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('CLOSE_MODAL', function() {
    it('sets modalIsOpen to false', function() {
      expect(state.modalIsOpen).to.eq(true);
      state = reducer(state, closeModal());
      expect(state.modalIsOpen).to.eq(false);
    });
  });
});
