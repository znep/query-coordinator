import reducer from 'reducers/modal';
import { openModal, closeModal } from 'actions/modal';

describe('reducers/modal', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('OPEN_MODAL', function() {
    it('sets modalIsOpen to false', function() {
      state = reducer(state, openModal());
      expect(state.modalIsOpen).to.eq(true);
    });
  });

  describe('CLOSE_MODAL', function() {
    it('sets modalIsOpen to false', function() {
      state = reducer(state, closeModal());
      expect(state.modalIsOpen).to.eq(false);
    });
  });
});
