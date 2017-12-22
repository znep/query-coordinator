/**
 * Show the access manager if its feature flag is enabled
 * (or do nothing if it's disabled)
 * @param {event} e Click event from whatever triggered this function
 * @param {function} onAccessManagerShown Function to call when the access manager is shown (optional)
 */
export const showAccessManager = (e, onAccessManagerShown) => {
  // if the access manager is not enabled, we basically do nothing in here
  const accessManagerModalEnabled =
    _.get(window, 'socrata.featureFlags.enable_access_manager_modal', false);

  if (accessManagerModalEnabled) {
    if (onAccessManagerShown) {
      onAccessManagerShown();
    }

    const refreshOnSave = true;
    window.socrata.showAccessManager(refreshOnSave);
    e.preventDefault();
  }
};
