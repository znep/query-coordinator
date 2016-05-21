import { connect } from 'react-redux';
import ContactModal from '../components/ContactModal';
import {
  setContactFormField,
  setContactFormRecaptchaLoaded,
  setContactFormErrors,
  submitContactForm,
  resetContactForm
} from '../actions';

function mapStateToProps(state) {
  return state.contactForm;
}

function mapDispatchToProps(dispatch) {
  return {
    setFormField: function(field, value) {
      dispatch(setContactFormField(field, value));
    },

    setRecaptchaLoaded: function(value) {
      dispatch(setContactFormRecaptchaLoaded(value));
    },

    setErrors: function(errors) {
      dispatch(setContactFormErrors(errors));
    },

    sendForm: function() {
      dispatch(submitContactForm());
    },

    resetForm: function() {
      dispatch(resetContactForm());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ContactModal);
