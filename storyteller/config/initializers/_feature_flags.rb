require 'signaller'
require 'feature_flag_monitor'

# This file is underscore-prefixed because Rails loads initializers in alphabetical order,
# and other initializers may need to rely on feature flags for further configuration.

feature_flag_signaller_uri = ENV['FEATURE_FLAG_SIGNALLER_URI'] || 'http://localhost:14567'
Signaller.configure do |config|
  config.base_uri = feature_flag_signaller_uri
  config.cache = Rails.cache
  config.logger = Rails.logger
  config.mute_cache_logs = Rails.env.production?
  config.expiry_of(endpoint_type: :get, has_duration: 5.seconds)
  config.expiry_of(endpoint_type: :domain, has_duration: 5.seconds)
end

if defined?(FeatureFlagMonitor)
  FeatureFlagMonitor.configure do |config|
    config.consul_uri = ENV['CONSUL_SERVICE_URI'] || 'http://localhost:8500'
    config.feature_flag_monitor_uri = ENV['FEATURE_FLAG_MONITOR_URI'] || 'http://localhost:1255'
  end
end

Rails.application.config.feature_flag_service = ENV.fetch('FEATURE_FLAG_SERVICE', :signaller).to_sym rescue :signaller
