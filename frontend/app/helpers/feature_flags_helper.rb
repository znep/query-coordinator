module FeatureFlagsHelper

  # NOTE: This is deprecated. Please use render_feature_flags_for_javascript in application_helper.
  def feature_flags_as_json
    FeatureFlags.derive(nil, defined?(request) ? request : nil).to_h
  end

end
