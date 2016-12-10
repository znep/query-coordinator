export const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
  // 'X-CSRF-Token': window.serverConfig.csrfToken // TODO get this
};

// Used to throw errors from non-200 responses when using fetch.
export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

export function getJson(resp) {
  return resp.json();
}
