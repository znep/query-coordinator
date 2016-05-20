import _ from 'lodash';
import mixpanel from './lib/mixpanelTracking';
import {
  EMIT_MIXPANEL_EVENT,
  SET_CONTACT_FORM_FIELD,
  SET_CONTACT_FORM_RECAPTCHA_LOADED,
  SET_CONTACT_FORM_ERRORS,
  SEND_CONTACT_FORM,
  RESET_CONTACT_FORM,
  HANDLE_CONTACT_FORM_SUCCESS,
  HANDLE_CONTACT_FORM_FAILURE
} from './actions';

function datasetLandingPage(state, action) {
  // TODO: Decide how we want to structure our reducers. How we decide to modify state will
  // help determine how to structure this switch.
  if (_.isUndefined(state)) {
    return {
      view: window.initialState.view,
      featuredViews: window.initialState.featuredViews,
      contactForm: initialContactFormState()
    };
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case EMIT_MIXPANEL_EVENT:
      mixpanel.sendPayload(
        action.data.name,
        action.data.properties
      );
      return state;

    case SET_CONTACT_FORM_FIELD:
      state.contactForm.fields[action.field] = action.value;
      return state;

    case SET_CONTACT_FORM_RECAPTCHA_LOADED:
      state.contactForm.recaptchaLoaded = action.value;
      return state;

    case SET_CONTACT_FORM_ERRORS:
      state.contactForm.errors = action.errors;
      return state;

    case SEND_CONTACT_FORM:
      state.contactForm.status = 'sending';
      return state;

    case RESET_CONTACT_FORM:
      state.contactForm = initialContactFormState();
      return state;

    case HANDLE_CONTACT_FORM_SUCCESS:
      state.contactForm.status = 'success';
      return state;

    case HANDLE_CONTACT_FORM_FAILURE:
      state.contactForm.status = 'failure';
      return state;

    default:
      return state;
  }
}

function initialContactFormState() {
  return {
    errors: [],
    fields: {
      email: _.get(window.sessionData, 'email', ''),
      subject: '',
      message: ''
    },
    recaptchaLoaded: false,
    status: '',
    token: _.get(window.contactFormData, 'token', '')
  };
}

export default datasetLandingPage;
