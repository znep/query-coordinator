// TODO: capture the shared share of the API response state and include this method near that
export function anyCallHasError(apiCalls) {
  return _.some(apiCalls, hasApiError);
}

export function hasApiError(apiCall) {
  return _.isMatch(apiCall, {type: 'Error'});
}
