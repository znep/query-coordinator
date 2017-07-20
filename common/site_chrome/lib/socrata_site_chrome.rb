module SocrataSiteChrome
  class << self
    attr_accessor :configuration
  end

  class Configuration
    attr_accessor :app_token

    def initialize
      @app_token = nil
    end
  end

  if defined?(Rails) # If the host application is not Rails (i.e. Sinatra) do something different.
    require 'socrata_site_chrome/engine'

    # EN-11291: Exposes Site Chrome's view templates to the hosting application
    site_chrome_views_pathset = ActionView::PathSet.new(["#{SocrataSiteChrome::Engine.root}/app/views/socrata_site_chrome"])
    ActionController::Base.view_paths += site_chrome_views_pathset

  end

  require_relative '../app/models/socrata_site_chrome/model'
  require_relative '../app/models/socrata_site_chrome/find_extensions'
  require_relative '../app/models/socrata_site_chrome/user'

  require 'socrata_site_chrome/cache_key'
  require 'socrata_site_chrome/custom_content'
  require 'socrata_site_chrome/domain_config'
  require 'socrata_site_chrome/feature_set'
  require 'socrata_site_chrome/locale_config'
  require 'socrata_site_chrome/middleware'
  require 'socrata_site_chrome/shared_helper_methods'
  require 'socrata_site_chrome/site_chrome'

  require 'site_chrome_consumer_helpers' # Helper methods for the host application
  require 'socrata_site_chrome/test/helpers'

  def self.configuration
    @configuration ||= Configuration.new
  end

  def self.configure
    yield(configuration)
  end

  def self.reset
    @configuration = Configuration.new
  end

end
