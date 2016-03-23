Rails.application.config.core_service_uri = begin
  uri = ENV['CORESERVICE_URI'] || 'http://localhost:8080'
  uri = "http://#{uri}" unless uri.starts_with?('http')
  uri
end

Rails.application.config.core_service_app_token = ENV['CORESERVICE_APP_TOKEN']

# These timeouts might turn out to be overly-aggressive. We will have
# to see how it goes.
Rails.application.config.core_service_request_open_timeout = ENV['CORESERVICE_OPEN_TIMEOUT'] || 5
Rails.application.config.core_service_request_read_timeout = ENV['CORESERVICE_READ_TIMEOUT'] || 5

# Base URI for the consul server in the current ENV
Rails.application.config.consul_service_uri = ENV['CONSUL_SERVICE_URI'] || 'http://localhost:8500'
Rails.application.config.consul_service_timeout = (ENV['CONSUL_SERVICE_TIMEOUT_SECONDS'] || 2).to_i

# Enable or disable text display/editing on full-bleed image component.
Rails.application.config.full_bleed_image_enable_text_overlay = (ENV['FULL_BLEED_IMAGE_ENABLE_TEXT_OVERLAY'].to_s.downcase == 'true')

# Enable stats link in the story settings panel
Rails.application.config.enable_settings_panel_stats_link = (ENV['ENABLE_SETTINGS_PANEL_STATS_LINK'].to_s.downcase == 'true')
