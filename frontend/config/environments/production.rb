Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.cache_classes = true

  # Eager load code on boot. This eager loads most of Rails and
  # your application in memory, allowing both threaded web servers
  # and those relying on copy on write to perform better.
  # Rake tasks automatically ignore this option for performance.
  config.eager_load = true

  # Full error reports are disabled and caching is turned on.
  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  # See if elasticache auto-discovery is available
  elasticache_endpoint = ENV['MEMCACHED_CONFIG_ENDPOINT']

  memcached_hosts = if elasticache_endpoint.present?
    Dalli::ElastiCache.new(elasticache_endpoint).servers
  else
    ENV['MEMCACHED_HOSTS'].to_s.split(',').map(&:strip)
  end

  raise 'No memcached hosts are configured, please set MEMCACHED_HOSTS or MEMCACHED_CONFIG_ENDPOINT.' if memcached_hosts.empty?

  config.cache_store = :dalli_store, memcached_hosts, {
    :namespace => ENV['MEMCACHED_KEYSPACE'] || 'webapp_rails4',
    :expires_in => 1.day,
    :compress => true,
    :value_max_bytes => ENV['MEMCACHED_VALUE_MAX_BYTES'] || (4 * 1024 * 1024)
  }

  # Disable serving static files from the `/public` folder by default since
  # Apache or NGINX already handles this.
  config.serve_static_files = ENV['RAILS_SERVE_STATIC_FILES'].present?

  # Compress JavaScripts and CSS.
  config.assets.js_compressor = :jsmin # Note: This is overridden by config in assets.yml
  # config.assets.css_compressor = :sass

  # Do not fallback to assets pipeline if a precompiled asset is missed.
  config.assets.compile = false

  # Asset digests allow you to set far-future HTTP expiration dates on all assets,
  # yet still be able to expire them through the digest params.
  config.assets.digest = true

  # `config.assets.precompile` and `config.assets.version` have moved to config/initializers/assets.rb

  # Specifies the header that your server uses for sending files.
  # config.action_dispatch.x_sendfile_header = 'X-Sendfile' # for Apache
  # config.action_dispatch.x_sendfile_header = 'X-Accel-Redirect' # for NGINX

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  # config.force_ssl = true

  # Use the lowest log level to ensure availability of diagnostic information
  # when problems arise.
  config.log_level = :debug

  # Prepend all log lines with the following tags.
  # config.log_tags = [ :subdomain, :uuid ]

  # Use a different logger for distributed setups.
  config.logger = ActiveSupport::TaggedLogging.new(Logger.new(STDOUT))

  # Enable serving of images, stylesheets, and JavaScripts from an asset server.
  # config.action_controller.asset_host = 'http://assets.example.com'

  # Ignore bad email addresses and do not raise email delivery errors.
  # Set this to true and configure the email server for immediate delivery to raise delivery errors.
  # config.action_mailer.raise_delivery_errors = false

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  config.i18n.fallbacks = true

  # Send deprecation notices to registered listeners. (can be :log, :notify, :stderr)
  config.active_support.deprecation = :log

  # Use default logging formatter so that PID and timestamp are not suppressed.
  config.log_formatter = ::Logger::Formatter.new

  # Do not dump schema after migrations.
  # config.active_record.dump_schema_after_migration = false
end