# Load the Rails application.
require File.expand_path('../application', __FILE__)
require_relative '../lib/request_host'

Rails.application.config.middleware.insert_before Rack::Sendfile, RequestHost

# Initialize the Rails application.
Rails.application.initialize!
