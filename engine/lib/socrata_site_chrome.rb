module SocrataSiteChrome
  class << self
    attr_accessor :configuration
  end

  # Global configuration options for the engine go here

  if defined?(Rails) # If the host application is not Rails (i.e. Sinatra) do something different.
    require 'socrata_site_chrome/engine'

    site_chrome_views_pathset = ActionView::PathSet.new(["#{SocrataSiteChrome::Engine.root}/app/views/site_chrome"])
    ActionController::Base.view_paths += site_chrome_views_pathset

  end

  require_relative '../app/models/socrata_site_chrome/model'
  require_relative '../app/models/socrata_site_chrome/find_extensions'
  require_relative '../app/models/socrata_site_chrome/user'

  require 'socrata_site_chrome/application_helper'
  require 'socrata_site_chrome/custom_content'
  require 'socrata_site_chrome/domain_config'
  require 'socrata_site_chrome/feature_set'
  require 'socrata_site_chrome/locale_config'
  require 'socrata_site_chrome/middleware'
  require 'socrata_site_chrome/site_chrome'
  require 'socrata_site_chrome/version'

  require 'site_chrome_helper' # Helper methods for the host application, not the engine

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
