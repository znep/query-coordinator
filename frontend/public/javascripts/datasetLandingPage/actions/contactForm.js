import 'whatwg-fetch';
import { checkStatus } from 'common/http';
import { emitMixpanelEvent } from './mixpanel';

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

export function setContactFormField(field, value) {
  return {
    type: SET_CONTACT_FORM_FIELD,
    field,
    value
  };
}

export function setContactFormRecaptchaLoaded(value) {
  return {
    type: SET_CONTACT_FORM_RECAPTCHA_LOADED,
    value
  };
}

export function sendContactForm() {
  return {
    type: SEND_CONTACT_FORM
  };
}

export function resetContactForm() {
  return {
    type: RESET_CONTACT_FORM
  };
}

export function handleContactFormSuccess() {
  return {
    type: HANDLE_CONTACT_FORM_SUCCESS
  };
}

export function handleContactFormFailure() {
  return {
    type: HANDLE_CONTACT_FORM_FAILURE
  };
}

export function handleContactFormRecaptchaError() {
  return {
    type: HANDLE_CONTACT_FORM_RECAPTCHA_ERROR
  };
}

export function handleContactFormRecaptchaReset() {
  return {
    type: HANDLE_CONTACT_FORM_RECAPTCHA_RESET
  };
}

export function submitContactForm() {
  return (dispatch, getState) => {
    const state = getState();
    const viewId = state.view.id;
    const { fields } = state.contactForm;
    const { csrfToken } = window.serverConfig;

    dispatch(sendContactForm());

    // Send off email request
    fetch(`/datasets/${viewId}/contact_dataset_owner`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        id: viewId,
        type: 'other',
        subject: fields.subject.value,
        message: fields.message.value,
        from_address: fields.email.value,
        recaptcha_response_token: fields.recaptchaResponseToken
      })
    }).
      then(checkStatus).
      then((response) => response.json()).
      then(() => {
        dispatch(handleContactFormSuccess());
        dispatch(emitMixpanelEvent({ name: 'Contacted Dataset Owner' }));
      }).
      catch((error) =>
        error.response.json().
          then((response) => {
            if (response.message === 'Invalid Recaptcha') {
              dispatch(handleContactFormRecaptchaError());
            } else {
              dispatch(handleContactFormFailure());
            }
          })
      );
  };
}
