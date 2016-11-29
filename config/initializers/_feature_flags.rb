require 'signaller'

# This file is underscore-prefixed because Rails loads initializers in alphabetical order,
# and other initializers may need to rely on these variables for further configuration.

# Enable or disable Getty Images gallery
Rails.application.config.enable_getty_images_gallery = (ENV['ENABLE_GETTY_IMAGES_GALLERY'].to_s.downcase == 'true')

# If true, falls back to Core's deprecated user search (backed by clytemnestra).
# If false (default), uses Cetera for user searches via CeteraController.
Rails.application.config.enable_deprecated_user_search_api = (ENV['ENABLE_DEPRECATED_USER_SEARCH_API'].to_s.downcase == 'true')

feature_flag_signaller_uri = ENV['FEATURE_FLAG_SIGNALLER_URI'] || 'http://localhost:14567'
Signaller.configure do |config|
  config.base_uri = feature_flag_signaller_uri
  config.cache = Rails.cache
  config.logger = Rails.logger
  config.mute_cache_logs = Rails.env.production?
end
