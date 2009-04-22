# Be sure to restart your server when you modify this file

# Uncomment below to force Rails into production mode when
# you don't control web/app server and can't set it the proper way
# ENV['RAILS_ENV'] ||= 'production'

# Specifies gem version of Rails to use when vendor/rails is not present
RAILS_GEM_VERSION = '2.3.0' unless defined? RAILS_GEM_VERSION

MULTIUSER_SECRET = "zomg dont tell anyone"

# Bootstrap the Rails environment, frameworks, and default configuration
require File.join(File.dirname(__FILE__), 'boot')

# For reasons I can't really explain, Phusion Passenger complains if we load
# this below the Rails::Initializer block - it's like the code gets loaded
# before environment.rb loads?!
require 'uri'
coreservice_config = YAML.load(IO.read(RAILS_ROOT + "/config/coreservice.yml"))
CORESERVICE_URI = URI.parse(coreservice_config[RAILS_ENV]['site'])

Rails::Initializer.run do |config|
  # Settings in config/environments/* take precedence over those specified here.
  # Application configuration should go into files in config/initializers
  # -- all .rb files in that directory are automatically loaded.
  # See Rails::Configuration for more options.

  # Skip frameworks you're not going to use. To use Rails without a database
  # you must remove the Active Record framework.
  # config.frameworks -= [ :active_record, :active_resource, :action_mailer ]
  config.frameworks -= [ :active_record ]

  # request_store only caches things in-memory for a single request
  config.cache_store = :request_store


  # Only load the plugins named here, in the order given. By default, all plugins 
  # in vendor/plugins are loaded in alphabetical order.
  # :all can be used as a placeholder for all plugins not explicitly named
  # config.plugins = [ :exception_notification, :ssl_requirement, :all ]

  # Add additional load paths for your own custom dirs
  # config.load_paths += %W( #{RAILS_ROOT}/extras )

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
  config.i18n.default_locale = :blist

  # Your secret key for verifying cookie session data integrity.
  # If you change this key, all old sessions will become invalid!
  # Make sure the secret is at least 30 characters and all random, 
  # no regular words or you'll be exposed to dictionary attacks.
  config.action_controller.session = {
    :session_key => '_blist_session_id',
    :cookie_only => false,
    :session_http_only => false,
    :secret      => ')c)]? ?+7?BpJ4qbKi8@-D)T`@]])x'
  }

  # Use the database for sessions instead of the cookie-based default,
  # which shouldn't be used to store highly confidential information
  # (create the session table with "rake db:sessions:create")
  # config.action_controller.session_store = :active_record_store
  config.action_controller.session_store = :blist_cookie_store

  # Use SQL instead of Active Record's schema dumper when creating the test database.
  # This is necessary if your schema can't be completely dumped by the schema dumper,
  # like if you have constraints or database-specific column types
  # config.active_record.schema_format = :sql

  # Activate observers that should always be running
  # Please note that observers generated using script/generate observer need to have an _observer suffix
  # config.active_record.observers = :cacher, :garbage_collector, :forum_observer


  # Specify gems that this application depends on. 
  # Gems specified here are NOT installed in the vendor directory; you need a system-wide 
  # installation, typically because they have C-compiled extensions that we can't reliably
  # vendor across multiple platforms (MacOSX, Linux)
  # They can then be installed with "rake gems:install" on new installations.
  # You have to specify the :lib option for libraries, where the Gem name (sqlite3-ruby) differs from the file itself (sqlite3)
  # config.gem "bj"
  # config.gem "hpricot", :version => '0.6', :source => "http://code.whytheluckystiff.net"
  # config.gem "sqlite3-ruby", :lib => "sqlite3"
  # config.gem "aws-s3", :lib => "aws/s3"
  config.gem "json"

  # Use gems in the vendor directory: http://errtheblog.com/post/2120
  config.load_paths += Dir["#{RAILS_ROOT}/vendor/gems/**"].map do |dir| 
    File.directory?(lib = "#{dir}/lib") ? lib : dir
  end

  # These gems are required, but should be available in the vendor/gems directory.
  config.gem 'ruby-hmac', :lib => 'hmac-sha1'
  config.gem 'multipart-post', :lib => 'net/http/post/multipart'
end

multiuser_config = YAML.load(IO.read(RAILS_ROOT + "/config/multiuser.yml") )
MULTIUSER_BRIDGE_HOST  = multiuser_config[RAILS_ENV]["bridge_host"]
MULTIUSER_BRIDGE_PORT  = multiuser_config[RAILS_ENV]["bridge_port"]
MULTIUSER_ORBITED_PORT = multiuser_config[RAILS_ENV]["orbited_port"]
MULTIUSER_IE_PORT      = multiuser_config[RAILS_ENV]["ie_port"]
MULTIUSER_CHANGE_IP    = multiuser_config[RAILS_ENV]["change_ip"]
MULTIUSER_CHANGE_PORT  = multiuser_config[RAILS_ENV]["change_port"]

swf_config = YAML.load(IO.read(RAILS_ROOT + "/config/swf.yml") )
SWF_DIR       = swf_config[RAILS_ENV]["dir"]

external_config = YAML.load(IO.read(RAILS_ROOT + "/config/external.yml") )
BLIST_RSS = external_config[RAILS_ENV]["blist_blog_rss"]

REVISION_FILE = ["#{RAILS_ROOT}/../REVISION_FLEX", "#{RAILS_ROOT}/../REVISION"].detect do |filename|
  File.exist?(filename)
end

begin
  REVISION_NUMBER = File.open(REVISION_FILE, "r").read().chomp()
  REVISION_DATE = File.stat(REVISION_FILE).mtime.to_i
rescue
  REVISION_NUMBER = nil
  REVISION_DATE = nil
end

