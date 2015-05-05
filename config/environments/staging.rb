Frontend::Application.configure do
  # Settings specified here will take precedence over those in config/environment.rb

  # The production environment is meant for finished, "live" apps.
  # Code is not reloaded between requests
  config.cache_classes = true

  # Enable threaded mode
  # config.threadsafe!

  # Use a different logger for distributed setups
  # config.logger = SyslogLogger.new

  # Full error reports are disabled and caching is turned on
  config.consider_all_requests_local = false
  config.action_controller.perform_caching             = true

  # Use a different cache store in production
  config.cache_store = :mem_cache_store, 'vm01.ord1.socrata.com', { :namespace => 'webapp', :value_max_bytes => 2000000 }

  # Enable serving of images, stylesheets, and javascripts from an asset server
  # config.action_controller.asset_host                  = "http://assets.example.com"

  # Disable delivery errors, bad email addresses will be ignored
  # config.action_mailer.raise_delivery_errors = false

  config.middleware.use "Graylog2Exceptions", :hostname => 'graylog2.sea1.socrata.com', :facility => 'frontend', :environment => 'staging'
  if ENV["UNICORN"].to_i > 0
    config.logger = ActiveSupport::TaggedLogging.new(Logger.new(STDOUT))
    config.logger.level = Logger.const_get(ENV['LOG_LEVEL'] ? ENV['LOG_LEVEL'].upcase : 'INFO')
    config.log_level    = (ENV['LOG_LEVEL'] ? ENV['LOG_LEVEL'].downcase : 'info').to_sym
  end
end
