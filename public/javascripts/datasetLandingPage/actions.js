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

export const REQUEST_FEATURED_VIEWS = 'REQUEST_FEATURED_VIEWS';
export function requestFeaturedViews() {
  return {
    type: REQUEST_FEATURED_VIEWS
  };
}

export const RECEIVE_FEATURED_VIEWS = 'RECEIVE_FEATURED_VIEWS';
export function receiveFeaturedViews(featuredViews) {
  return {
    type: RECEIVE_FEATURED_VIEWS,
    featuredViews: featuredViews
  };
}

export const HANDLE_FEATURED_VIEWS_ERROR = 'HANDLE_FEATURED_VIEWS_ERROR';
export function handleFeaturedViewsError() {
  return {
    type: HANDLE_FEATURED_VIEWS_ERROR
  };
}

export const DISMISS_FEATURED_VIEWS_ERROR = 'DISMISS_FEATURED_VIEWS_ERROR';
export function dismissFeaturedViewsError() {
  return {
    type: DISMISS_FEATURED_VIEWS_ERROR
  };
}

export function loadMoreFeaturedViews() {
  return function(dispatch, getState) {
    var state = getState();

    if (_.get(state, 'featuredViews.isLoading', false)) {
      return;
    }

    var viewId = state.view.id;
    var offset = _.get(state, 'featuredViews.list.length', 0);
    var limit = 4;

    dispatch(requestFeaturedViews());

    fetch(`/dataset_landing_page/${viewId}/featured_views?limit=${limit}&offset=${offset}`).
      then(response => response.json()).
      then(featuredViews => dispatch(receiveFeaturedViews(featuredViews)))
      ['catch'](() => dispatch(handleFeaturedViewsError()));
  };
}

export const TOGGLE_FEATURED_VIEWS = 'TOGGLE_FEATURED_VIEWS';
export function toggleFeaturedViews() {
  return {
    type: TOGGLE_FEATURED_VIEWS
  };
}
