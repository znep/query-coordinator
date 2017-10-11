require File.expand_path('../boot', __FILE__)

require 'action_controller/railtie'
require 'action_mailer/railtie'
require 'active_support/core_ext/numeric/time'
require 'rails/test_unit/railtie'
require 'semver'
require 'sprockets/railtie'

if defined?(Bundler)
  # Include gems from our /common Gemfile group.
  Bundler.require(:common)
  # If you precompile assets before deploying to production, use this line
  Bundler.require(*Rails.groups(:assets => %w(development test)))
  # If you want your assets lazily compiled in production, use this line
  # Bundler.require(:default, :assets, Rails.env)
end

module Frontend
  UID_REGEXP = /\w{4}-\w{4}/
  INTEGER_REGEXP = /-?\d+/

  class << self
    attr_accessor :statsd

    def auth0_configured?
      AUTH0_CONFIGURED
    end
  end

  def self.version
    Application.config.version
  end

  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Custom directories with classes and modules you want to be autoloadable.
    config.autoload_paths += %W(#{config.root}/lib)
    config.autoload_paths += %W(#{config.root}/lib/refinements)
    config.autoload_paths += %W(#{Rails.root}/app/models/external_configs)
    config.autoload_paths += %W(#{Rails.root}/../platform-ui/lib)

    # Only load the plugins named here, in the order given (default is alphabetical).
    # :all can be used as a placeholder for all plugins not explicitly named.
    # config.plugins = [ :exception_notification, :ssl_requirement, :all ]

    # Activate observers that should always be running.
    # config.active_record.observers = :cacher, :garbage_collector, :forum_observer

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    config.time_zone = 'UTC'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :de

    # Configure the default encoding used in templates for Ruby 1.9.
    config.encoding = 'utf-8'

    # Configure sensitive parameters which will be filtered from the log file.
    config.filter_parameters += [:password]

    # Use SQL instead of Active Record's schema dumper when creating the database.
    # This is necessary if your schema can't be completely dumped by the schema dumper,
    # like if you have constraints or database-specific column types
    # config.active_record.schema_format = :sql

    # Enforce whitelist mode for mass assignment.
    # This will create an empty whitelist of attributes available for mass-assignment for all models
    # in your app. As such, your models will need to explicitly whitelist or blacklist accessible
    # parameters by using an attr_accessible or attr_protected declaration.
    # config.active_record.whitelist_attributes = true

    # Enable the asset pipeline
    config.assets.enabled = true

    # Version of your assets, change this if you want to expire all your assets
    config.assets.version = '1.0'

    # This prefix should be used as part of the cache_key for ALL objects cached in the app with memcached
    config.cache_key_prefix = File.read(File.join(Rails.root, 'REVISION'))[0..7] rescue 'beefcafe'

    config.cache_store = :dalli_store, *ENV['MEMCACHED_HOSTS'].to_s.split(',').map(&:strip), {
      :namespace => ENV['MEMCACHED_KEYSPACE'] || 'webapp_rails4',
      :expires_in => 1.day,
      :compress => true,
      :value_max_bytes => ENV['MEMCACHED_VALUE_MAX_BYTES'] || (4 * 1024 * 1024)
    }

    # TTL for fragment caching, currently only used for DataSlate
    config.cache_ttl_fragment = 24.hours
    # TTL for model caching, when calling find_cache* - this caching is beneficial, but is more
    # likely to result in columnId synchronization issues. Caching the model is inherently
    # dangerous because we reference datasets by columnids which can change on updates. We /may/
    # want to turn this off entirely for canvas View.find
    config.cache_ttl_model = 5.minutes
    # row caching on View models, when using get_rows_cached*
    config.cache_ttl_rows = 60.minutes
    # search caching when using search_cached
    config.cache_ttl_search = 15.minutes
    # TTL for items within a manifest before we force a check against the core-server manifest or
    # reinitialize a search. This is set on a per-manifest basis; so individual dataslate pages
    # may have differing TTLs.
    config.manifest_check_age = 15.minutes

    config.version = SemVer.find.format '%M.%m.%p'

    config.coreservice_uri = Rails.application.config_for(:config)['coreservice_uri']

    # Set up logging
    config.lograge.enabled = true
    config.lograge.formatter = Lograge::Formatters::KeyValue.new

    config.action_view.sanitized_allowed_attributes = Set.new(%w(href src width height alt cite datetime title class name xml:lang abbr rel))

    # See also config/initializers/webpack.rb
    # This is where the values in Rails.configuration.webpack are initialized.
    config.webpack = {
      :use_manifest => !Rails.env.development?,
      :use_dev_server => Rails.env.development?,
      :dev_server_port => 3030,
      :asset_manifest => {}
    }

    # Do not swallow errors in after_commit/after_rollback callbacks.
    # config.active_record.raise_in_transactional_callbacks = true

    # Used for asset pipeline (we can't use the default /assets because core uses that route).
    # There is also an entry in dev-server/nginx.conf so that we don't clash with a govstat route.
    config.assets.prefix = '/asset_pipeline'
  end
end
