require 'signaller'

# This file is underscore-prefixed because Rails loads initializers in alphabetical order,
# and other initializers may need to rely on feature flags for further configuration.

feature_flag_signaller_uri = ENV['FEATURE_FLAG_SIGNALLER_URI'] || 'http://localhost:14567'
Signaller.configure do |config|
  config.base_uri = feature_flag_signaller_uri
  config.cache = Rails.cache
  config.logger = Rails.logger
  config.mute_cache_logs = Rails.env.production?
end
