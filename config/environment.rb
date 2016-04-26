# Load the Rails application.
require File.expand_path('../application', __FILE__)

HTTParty::Basement.default_options.update(verify: false)

# Initialize the Rails application.
Rails.application.initialize!
