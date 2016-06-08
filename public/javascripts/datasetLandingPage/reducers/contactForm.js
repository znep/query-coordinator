import _ from 'lodash';

import {
  SET_CONTACT_FORM_FIELD,
  SET_CONTACT_FORM_RECAPTCHA_LOADED,
  SEND_CONTACT_FORM,
  RESET_CONTACT_FORM,
  HANDLE_CONTACT_FORM_SUCCESS,
  HANDLE_CONTACT_FORM_FAILURE,
  HANDLE_CONTACT_FORM_RECAPTCHA_ERROR,
  HANDLE_CONTACT_FORM_RECAPTCHA_RESET
} from '../actions';

var currentUserEmail = _.get(window.sessionData, 'email', '');

var initialState = {
  fields: {
    email: {
      value: currentUserEmail,
      invalid: _.isEmpty(currentUserEmail)
    },
    subject: {
      value: '',
      invalid: true
    },
    message: {
      value: '',
      invalid: true
    },
    recaptchaResponseToken: ''
  },
  recaptchaLoaded: false,
  resetRecaptcha: false,
  status: '',
  token: _.get(window.serverConfig, 'csrfToken', '')
};

export default function(state, action) {
  if (_.isUndefined(state)) {
    return initialState;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case SET_CONTACT_FORM_FIELD:
      state.fields[action.field] = action.value;
      return state;

    case SET_CONTACT_FORM_RECAPTCHA_LOADED:
      state.recaptchaLoaded = action.value;
      return state;

    case SEND_CONTACT_FORM:
      state.status = 'sending';
      return state;

    case RESET_CONTACT_FORM:
      return initialState;

    case HANDLE_CONTACT_FORM_SUCCESS:
      state.status = 'success';
      return state;

    case HANDLE_CONTACT_FORM_FAILURE:
      state.status = 'failure';
      return state;

    case HANDLE_CONTACT_FORM_RECAPTCHA_ERROR:
      state.status = '';
      state.fields.recaptchaResponseToken = '';
      state.resetRecaptcha = true;
      return state;

    case HANDLE_CONTACT_FORM_RECAPTCHA_RESET:
      state.resetRecaptcha = false;
      return state;

    default:
      return state;
  }
}
