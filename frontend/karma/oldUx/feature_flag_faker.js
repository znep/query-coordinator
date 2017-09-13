// Some tests import code that immediately looks for feature flags, so we can't
// just set the feature flags in a beforeEach.
window.blist = (window.blist || {});
window.blist.feature_flags = {
  enable_2017_grid_refresh: true,
  ignore_metadata_jsonquery_property_in_view: 'frontend'
};
