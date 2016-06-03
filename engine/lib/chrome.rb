module Chrome

  # Global configuration options for the engine go here

  if defined?(Rails) # If the host application is not Rails (i.e. Sinatra) do something different.
    require 'chrome/engine'
  end

  require 'chrome/domain_config'
  require 'chrome/site_chrome'
  require 'chrome/version'
  require 'chrome/application_helper'

  require 'site_chrome_helper' # ApplicationHelper methods for the host application, not the engine

end
