# Load the Rails application.
require File.expand_path('../application', __FILE__)
require_relative '../lib/request_host'
require_relative '../lib/socrata_session'
require_relative '../lib/referrer_middleware'

Rails.application.config.middleware.insert_before Rack::Sendfile, RequestHost
Rails.application.config.middleware.insert_after ActionDispatch::Cookies, SocrataSession
Rails.application.config.middleware.use ReferrerMiddleware

# Initialize the Rails application.
Rails.application.initialize!
