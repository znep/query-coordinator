Frontend::Application.configure do
  # Settings specified here will take precedence over those in config/environment.rb

  # The production environment is meant for finished, "live" apps.
  # Code is not reloaded between requests
  config.cache_classes = true

  # Enable threaded mode
  # config.threadsafe!

  # Full error reports are disabled and caching is turned on
  config.consider_all_requests_local = false
  config.action_controller.perform_caching             = true

  # Use a different cache store in production
  config.cache_store = :mem_cache_store, ENV['MEMCACHED_HOST'] || 'memcache', { :namespace => 'webapp', :value_max_bytes => 2000000 }

  # Enable serving of images, stylesheets, and javascripts from an asset server
  # config.action_controller.asset_host                  = "http://assets.example.com"

  # Disable delivery errors, bad email addresses will be ignored
  # config.action_mailer.raise_delivery_errors = false

  # Logging options
  config.logger.level = Logger.const_get((ENV['LOG_LEVEL'] || 'INFO').upcase)
end
