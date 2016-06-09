module SocrataSiteChrome

  # Global configuration options for the engine go here

  if defined?(Rails) # If the host application is not Rails (i.e. Sinatra) do something different.
    require 'socrata_site_chrome/engine'
  end

  require 'socrata_site_chrome/domain_config'
  require 'socrata_site_chrome/site_chrome'
  require 'socrata_site_chrome/version'
  require 'socrata_site_chrome/application_helper'

  require 'site_chrome_helper' # ApplicationHelper methods for the host application, not the engine

end
