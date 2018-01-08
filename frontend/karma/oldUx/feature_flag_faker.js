// Some tests import code that immediately looks for feature flags, so we can't
// just set the feature flags in a beforeEach.
window.socrata = (window.socrata || {});
window.socrata.featureFlags = {
  enable_2017_grid_view_refresh: true
};
