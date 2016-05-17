import { getDefaultStore } from 'testStore';
import reducer from 'reducers';
import {
  handleContactFormFailure,
  handleContactFormSuccess,
  sendContactForm,
  setContactFormField,
  setContactFormRecaptchaLoaded,
  setContactFormErrors,
  submitContactForm,
  resetContactForm
} from 'actions';

describe('reducers/contactModal', function() {
  var state;

  beforeEach(function() {
    var store = getDefaultStore();
    state = store.getState();
  });

  describe('SET_CONTACT_FORM_FIELD', function() {
    it('sets the value of the specified field', function() {
      state.contactForm.fields.message = 'pandas';

      var result = reducer(state, setContactFormField('message', 'wombats'));
      expect(result.contactForm.fields.message).to.equal('wombats');
    });
  });

  describe('SET_CONTACT_FORM_RECAPTCHA_LOADED', function() {
    it('sets the value of recaptchaLoaded', function() {
      state.contactForm.recaptchaLoaded = false;

      var result = reducer(state, setContactFormRecaptchaLoaded(true));
      expect(result.contactForm.recaptchaLoaded).to.equal(true);
    });
  });

  describe('SET_CONTACT_FORM_ERRORS', function() {
    it('sets the value of the errors array', function() {
      state.contactForm.errors = [];

      var result = reducer(state, setContactFormErrors(['bad', 'errors']));
      expect(result.contactForm.errors).to.deep.equal(['bad', 'errors']);
    });
  });

  describe('SEND_CONTACT_FORM', function() {
    it('sets status to "sending"', function() {
      state.contactForm.status = '';

      var result = reducer(state, sendContactForm());
      expect(result.contactForm.status).to.equal('sending');
    });
  });

  describe('HANDLE_CONTACT_FORM_SUCCESS', function() {
    it('sets status to "success"', function() {
      state.contactForm.status = '';

      var result = reducer(state, handleContactFormSuccess());
      expect(result.contactForm.status).to.equal('success');
    });
  });

  describe('HANDLE_CONTACT_FORM_FAILURE', function() {
    it('sets status to "failure"', function() {
      state.contactForm.status = '';

      var result = reducer(state, handleContactFormFailure());
      expect(result.contactForm.status).to.equal('failure');
    });
  });
});
