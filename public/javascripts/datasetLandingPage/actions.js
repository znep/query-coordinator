import { POPULAR_VIEWS_CHUNK_SIZE } from './lib/constants';

// Used to throw errors from non-200 responses when using fetch.
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    var error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

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

export const REQUEST_POPULAR_VIEWS = 'REQUEST_POPULAR_VIEWS';
export function requestPopularViews() {
  return {
    type: REQUEST_POPULAR_VIEWS
  };
}

export const RECEIVE_POPULAR_VIEWS = 'RECEIVE_POPULAR_VIEWS';
export function receivePopularViews(popularViews) {
  return {
    type: RECEIVE_POPULAR_VIEWS,
    popularViews: popularViews
  };
}

export const HANDLE_POPULAR_VIEWS_ERROR = 'HANDLE_POPULAR_VIEWS_ERROR';
export function handlePopularViewsError() {
  return {
    type: HANDLE_POPULAR_VIEWS_ERROR
  };
}

export const DISMISS_POPULAR_VIEWS_ERROR = 'DISMISS_POPULAR_VIEWS_ERROR';
export function dismissPopularViewsError() {
  return {
    type: DISMISS_POPULAR_VIEWS_ERROR
  };
}

export function loadMorePopularViews() {
  return function(dispatch, getState) {
    var state = getState();

    if (_.get(state, 'popularViews.isLoading', false)) {
      return;
    }

    var viewId = state.view.id;
    var offset = _.get(state, 'popularViews.list.length', 0);
    var limit = POPULAR_VIEWS_CHUNK_SIZE + 1;

    dispatch(requestPopularViews());

    fetch(`/dataset_landing_page/${viewId}/popular_views?limit=${limit}&offset=${offset}`).
      then(checkStatus).
      then(response => response.json()).
      then(popularViews => dispatch(receivePopularViews(popularViews)))
      ['catch'](() => dispatch(handlePopularViewsError()));
  };
}

export const TOGGLE_POPULAR_VIEWS = 'TOGGLE_POPULAR_VIEWS';
export function togglePopularViews() {
  return {
    type: TOGGLE_POPULAR_VIEWS
  };
}
