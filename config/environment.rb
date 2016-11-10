# Load the Rails application.
require File.expand_path('../application', __FILE__)

HTTParty::Basement.default_options.update(verify: false)

# Initialize the Rails application.
Rails.application.initialize!

site_chrome_views_pathset = ActionView::PathSet.new(["#{SocrataSiteChrome::Engine.root}/app/views/site_chrome"])
ActionController::Base.view_paths += site_chrome_views_pathset
