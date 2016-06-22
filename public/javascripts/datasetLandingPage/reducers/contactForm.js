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
} from '../actionTypes';

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

  switch (action.type) {
    case SET_CONTACT_FORM_FIELD:
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.field]: action.value
        }
      };

    case SET_CONTACT_FORM_RECAPTCHA_LOADED:
      return {
        ...state,
        recaptchaLoaded: action.value
      };

    case SEND_CONTACT_FORM:
      return {
        ...state,
        status: 'sending'
      };

    case RESET_CONTACT_FORM:
      return initialState;

    case HANDLE_CONTACT_FORM_SUCCESS:
      return {
        ...state,
        status: 'success'
      };

    case HANDLE_CONTACT_FORM_FAILURE:
      return {
        ...state,
        status: 'failure'
      };

    case HANDLE_CONTACT_FORM_RECAPTCHA_ERROR:
      return {
        ...state,
        status: '',
        fields: {
          ...state.fields,
          recaptchaResponseToken: ''
        },
        resetRecaptcha: true
      };

    case HANDLE_CONTACT_FORM_RECAPTCHA_RESET:
      return {
        ...state,
        resetRecaptcha: false
      };

    default:
      return state;
  }
}
