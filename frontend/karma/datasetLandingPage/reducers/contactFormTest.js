import { expect, assert } from 'chai';
import { getDefaultStore } from 'testStore';
import reducer from 'datasetLandingPage/reducers/contactForm';
import {
  handleContactFormFailure,
  handleContactFormSuccess,
  handleContactFormRecaptchaError,
  handleContactFormRecaptchaReset,
  sendContactForm,
  setContactFormField,
  setContactFormRecaptchaLoaded,
  submitContactForm,
  resetContactForm
} from 'datasetLandingPage/actions/contactForm';

describe('reducers/contactForm', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('SET_CONTACT_FORM_FIELD', function() {
    it('sets the value of the specified field', function() {
      state.fields.message = { value: 'pandas', invalid: false };

      var result = reducer(state, setContactFormField('message', {
        value: 'wombats',
        invalid: true
      }));
      expect(result.fields.message.value).to.equal('wombats');
      expect(result.fields.message.invalid).to.equal(true);
    });
  });

  describe('SET_CONTACT_FORM_RECAPTCHA_LOADED', function() {
    it('sets the value of recaptchaLoaded', function() {
      state.recaptchaLoaded = false;

      var result = reducer(state, setContactFormRecaptchaLoaded(true));
      expect(result.recaptchaLoaded).to.equal(true);
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

  describe('HANDLE_CONTACT_FORM_RECAPTCHA_ERROR', function() {
    it('sets status to ""', function() {
      state.status = 'pending';

      var result = reducer(state, handleContactFormRecaptchaError());
      expect(result.status).to.equal('');
    });

    it('resets recaptchaResponseToken to ""', function() {
      state.fields.recaptchaResponseToken = 'lovely-response-token';

      var result = reducer(state, handleContactFormRecaptchaError());
      expect(result.fields.recaptchaResponseToken).to.equal('');
    });

    it('sets resetRecaptcha to true', function() {
      state.resetRecaptcha = false;

      var result = reducer(state, handleContactFormRecaptchaError());
      assert.isTrue(result.resetRecaptcha);
    });
  });

  describe('HANDLE_CONTACT_FORM_RECAPTCHA_RESET', function() {
    it('sets resetRecaptcha to false', function() {
      state.resetRecaptcha = true;

      var result = reducer(state, handleContactFormRecaptchaReset());
      assert.isFalse(result.resetRecaptcha);
    });
  });
});
