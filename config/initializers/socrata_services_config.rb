Rails.application.config.core_service_uri = begin
  uri = ENV['CORESERVICE_URI'] || 'http://localhost:8080'
  uri = "http://#{uri}" unless uri.starts_with?('http')
  uri
end

if ENV['CORESERVICE_APP_TOKEN'].nil?
  raise 'CORESERVICE_APP_TOKEN not set on the environment. Please do so.'
end

Rails.application.config.core_service_app_token = ENV['CORESERVICE_APP_TOKEN']

# These timeouts might turn out to be overly-aggressive. We will have
# to see how it goes.
Rails.application.config.core_service_request_open_timeout = ENV['CORESERVICE_OPEN_TIMEOUT'] || 5
Rails.application.config.core_service_request_read_timeout = ENV['CORESERVICE_READ_TIMEOUT'] || 5
