import reducer from 'reducers/modal';
import {
  openExternalResourceWizard,
  closeExternalResourceWizard
} from 'actions/modal';

describe('reducers/modal', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('OPEN_EXTERNAL_RESOURCE_WIZARD', function() {
    it('sets modalIsOpen to false', function() {
      state = reducer(state, openExternalResourceWizard());
      expect(state.modalIsOpen).to.eq(true);
    });
  });

  describe('CLOSE_EXTERNAL_RESOURCE_WIZARD', function() {
    it('sets modalIsOpen to false', function() {
      state = reducer(state, closeExternalResourceWizard());
      expect(state.modalIsOpen).to.eq(false);
    });
  });
});
