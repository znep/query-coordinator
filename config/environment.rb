require File.expand_path('../application', __FILE__)

# Uncomment below to force Rails into production mode when
# you don't control web/app server and can't set it the proper way
# ENV['RAILS_ENV'] ||= 'production'

# Specifies gem version of Rails to use when vendor/rails is not present
# RAILS_GEM_VERSION = '2.3.14' unless defined? RAILS_GEM_VERSION
YAML::ENGINE.yamler = 'syck'

# Bootstrap the Rails environment, frameworks, and default configuration
require File.join(File.dirname(__FILE__), 'boot')

module Frontend
  class Application < Rails::Application
    config.middleware.use "HealthCheckMiddleware"

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.
    # See Rails::Configuration for more options.

    # request_store only caches things in-memory for a single request
    # config.cache_store = :mem_cache_store


    # Only load the plugins named here, in the order given. By default, all plugins 
    # in vendor/plugins are loaded in alphabetical order.
    # :all can be used as a placeholder for all plugins not explicitly named
    # config.plugins = [ :exception_notification, :ssl_requirement, :all ]

    # Add additional load paths for your own custom dirs
    config.autoload_paths += %W( #{Rails.root}/app/presenters )
    config.autoload_paths += %W( #{Rails.root}/lib )

    # Force all environments to use the same logger level
    # (by default production uses :info, the others :debug)
    # config.log_level = :debug

    # Make Time.zone default to the specified zone, and make Active Record store time values
    # in the database in UTC, and return them converted to the specified local zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Comment line to use default local time.
    config.time_zone = 'UTC'

    # The internationalization framework can be changed to have another default locale (standard is :en) or more load paths.
    # All files from config/locales/*.rb,yml are added automatically.
    # config.i18n.load_path << Dir[File.join(RAILS_ROOT, 'my', 'locales', '*.{rb,yml}')]
    # config.i18n.default_locale = :de

    # Store cached pages in a subdirectory "cache" of public/
    # This allows us to easily blow away the entire cache without getting
    # rid of any real public resources, at the expense of slightly more
    # complex Apache rewrite rules
    config.action_controller.page_cache_directory = File.join(Rails.root, 'public', 'cache/')

    # Use SQL instead of Active Record's schema dumper when creating the test database.
    # This is necessary if your schema can't be completely dumped by the schema dumper,
    # like if you have constraints or database-specific column types
    # config.active_record.schema_format = :sql

    # Activate observers that should always be running
    # Please note that observers generated using script/generate observer need to have an _observer suffix
    # config.active_record.observers = :cacher, :garbage_collector, :forum_observer

    # Disable rack-cache, as we have ATS and it's entirely redundant. Also, failing randomly.
    config.action_dispatch.rack_cache = nil
  end
end

Mime::Type.register "application/rdf+xml", :rdf
Mime::Type.register "application/vnd.ms-excel", :xls
#Mime::Type.register "application/pdf", :pdf
#Mime::Type.register "text/xml", :xml
#Mime::Type.register "application/json", :json
# Initialize the rails application
Frontend::Application.initialize!
