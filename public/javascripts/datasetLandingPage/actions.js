export const EMIT_MIXPANEL_EVENT = 'EMIT_MIXPANEL_EVENT';
export function emitMixpanelEvent(data) {
  return {
    type: EMIT_MIXPANEL_EVENT,
    data: data
  };
}

export const SET_CONTACT_FORM_FIELD = 'SET_CONTACT_FORM_FIELD';
export function setContactFormField(field, value) {
  return {
    type: SET_CONTACT_FORM_FIELD,
    field: field,
    value: value
  };
}

export const SET_CONTACT_FORM_RECAPTCHA_LOADED = 'SET_CONTACT_FORM_RECAPTCHA_LOADED';
export function setContactFormRecaptchaLoaded(value) {
  return {
    type: SET_CONTACT_FORM_RECAPTCHA_LOADED,
    value: value
  };
}

export const SET_CONTACT_FORM_ERRORS = 'SET_CONTACT_FORM_ERRORS';
export function setContactFormErrors(errors) {
  return {
    type: SET_CONTACT_FORM_ERRORS,
    errors: errors
  };
}

export const SEND_CONTACT_FORM = 'SEND_CONTACT_FORM';
export function sendContactForm() {
  return {
    type: SEND_CONTACT_FORM
  };
}

export const RESET_CONTACT_FORM = 'RESET_CONTACT_FORM';
export function resetContactForm() {
  return {
    type: RESET_CONTACT_FORM
  };
}

export const HANDLE_CONTACT_FORM_SUCCESS = 'HANDLE_CONTACT_FORM_SUCCESS';
export function handleContactFormSuccess() {
  return {
    type: HANDLE_CONTACT_FORM_SUCCESS
  };
}

export const HANDLE_CONTACT_FORM_FAILURE = 'HANDLE_CONTACT_FORM_FAILURE';
export function handleContactFormFailure() {
  return {
    type: HANDLE_CONTACT_FORM_FAILURE
  };
}

export function submitContactForm() {
  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      var error = new Error(response.statusText);
      error.response = response;
      throw error;
    }
  }

  return function(dispatch, getState) {
    var state = getState();
    var viewId = state.view.id;
    var { fields, token } = state.contactForm;

    dispatch(sendContactForm());

    // Send off email request
    fetch(`/datasets/${viewId}/contact_dataset_owner`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      },
      body: JSON.stringify({
        id: viewId,
        type: 'other',
        subject: fields.subject,
        message: fields.message,
        from_address: fields.email
      })
    }).
      then(checkStatus).
      then(response => response.json()).
      then(function(response) {
        if (response.success) {
          dispatch(handleContactFormSuccess());
          dispatch(emitMixpanelEvent({ name: 'Contacted Dataset Owner' }));
        } else {
          dispatch(handleContactFormFailure());
        }
      })['catch'](() => dispatch(handleContactFormFailure()));
  };
}
