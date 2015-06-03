# Load the Rails application.
require File.expand_path('../application', __FILE__)
require_relative '../lib/request_host'
require_relative '../lib/socrata_session'

Rails.application.config.middleware.insert_before Rack::Sendfile, RequestHost
Rails.application.config.middleware.insert_after ActionDispatch::Cookies, SocrataSession

# Initialize the Rails application.
Rails.application.initialize!
