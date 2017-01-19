import reducer from 'reducers/modal';
import {
  openModal,
  closeModal,
  openExternalResourceContainer,
  closeExternalResourceContainer
} from 'actions/modal';

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

  describe('OPEN_EXTERNAL_RESOURCE_CONTAINER', function() {
    it('sets modalPage to ExternalResourceContainer', function() {
      state = reducer(state, openExternalResourceContainer());
      expect(state.modalPage).to.eq('ExternalResourceContainer');
    });
  });

  describe('CLOSE_EXTERNAL_RESOURCE_CONTAINER', function() {
    it('sets modalPage to ResultsContainer', function() {
      state = reducer(state, closeExternalResourceContainer());
      expect(state.modalPage).to.eq('ResultsContainer');
    });
  });
});
