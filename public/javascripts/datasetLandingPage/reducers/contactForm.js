import _ from 'lodash';

import {
  SET_CONTACT_FORM_FIELD,
  SET_CONTACT_FORM_RECAPTCHA_LOADED,
  SET_CONTACT_FORM_ERRORS,
  SEND_CONTACT_FORM,
  RESET_CONTACT_FORM,
  HANDLE_CONTACT_FORM_SUCCESS,
  HANDLE_CONTACT_FORM_FAILURE
} from '../actions';

export default function(state, action) {
  if (_.isUndefined(state) || action.type === RESET_CONTACT_FORM) {
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

  state = _.cloneDeep(state);

  switch (action.type) {
    case SET_CONTACT_FORM_FIELD:
      state.fields[action.field] = action.value;
      return state;

    case SET_CONTACT_FORM_RECAPTCHA_LOADED:
      state.recaptchaLoaded = action.value;
      return state;

    case SET_CONTACT_FORM_ERRORS:
      state.errors = action.errors;
      return state;

    case SEND_CONTACT_FORM:
      state.status = 'sending';
      return state;

    case HANDLE_CONTACT_FORM_SUCCESS:
      state.status = 'success';
      return state;

    case HANDLE_CONTACT_FORM_FAILURE:
      state.status = 'failure';
      return state;

    default:
      return state;
  }
}
