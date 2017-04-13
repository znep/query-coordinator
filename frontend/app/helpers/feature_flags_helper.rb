module FeatureFlagsHelper

  # NOTE: This is deprecated. Please use render_feature_flags_for_javascript in application_helper.
  def feature_flags_as_json
    # TODO: Get rid of camelization of feature flags.
    # It breaks grep , autocomplete, and copy-paste from feature_flags.yml.
    FeatureFlags.derive(nil, defined?(request) ? request : nil).map { |k, v| [ k.camelize(:lower), v ] }.to_h
  end

end