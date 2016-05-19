import { getDefaultStore } from 'testStore';
import reducer from 'reducers/contactForm';
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

describe('reducers/contactForm', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('SET_CONTACT_FORM_FIELD', function() {
    it('sets the value of the specified field', function() {
      state.fields.message = 'pandas';

      var result = reducer(state, setContactFormField('message', 'wombats'));
      expect(result.fields.message).to.equal('wombats');
    });
  });

  describe('SET_CONTACT_FORM_RECAPTCHA_LOADED', function() {
    it('sets the value of recaptchaLoaded', function() {
      state.recaptchaLoaded = false;

      var result = reducer(state, setContactFormRecaptchaLoaded(true));
      expect(result.recaptchaLoaded).to.equal(true);
    });
  });

  describe('SET_CONTACT_FORM_ERRORS', function() {
    it('sets the value of the errors array', function() {
      state.errors = [];

      var result = reducer(state, setContactFormErrors(['bad', 'errors']));
      expect(result.errors).to.deep.equal(['bad', 'errors']);
    });
  });

  describe('SEND_CONTACT_FORM', function() {
    it('sets status to "sending"', function() {
      state.status = '';

      var result = reducer(state, sendContactForm());
      expect(result.status).to.equal('sending');
    });
  });

  describe('HANDLE_CONTACT_FORM_SUCCESS', function() {
    it('sets status to "success"', function() {
      state.status = '';

      var result = reducer(state, handleContactFormSuccess());
      expect(result.status).to.equal('success');
    });
  });

  describe('HANDLE_CONTACT_FORM_FAILURE', function() {
    it('sets status to "failure"', function() {
      state.status = '';

      var result = reducer(state, handleContactFormFailure());
      expect(result.status).to.equal('failure');
    });
  });
});
