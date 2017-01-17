module FeatureFlagsHelper

  def feature_flags_as_json
    FeatureFlags.derive(nil, defined?(request) ? request : nil).map { |k, v| [ k.camelize(:lower), v ] }.to_h
  end

end
