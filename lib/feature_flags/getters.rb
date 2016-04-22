module FeatureFlags
  def self.value_for(feature_flag, options = {})
    view = options[:view]
    request = options[:request]
    is_iframe = options.fetch(:is_iframe, false)

    value = FeatureFlags.derive(view, request, is_iframe)[feature_flag]
    value = Getters.send(feature_flag.to_sym, value) if Getters.respond_to?(feature_flag.to_sym)
    value
  end

  module Getters
    def self.zealous_dataslate_cache_expiry(value)
      case value
        when TrueClass
          5.seconds
        when FalseClass
          nil
        else
          value.to_f.seconds
      end
    end
  end
end
