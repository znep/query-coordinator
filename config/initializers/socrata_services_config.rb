Rails.application.config.core_service_uri = begin
  uri = ENV['CORESERVICE_URI'] || 'http://localhost:8080'
  uri = "http://#{uri}" unless uri.starts_with?('http')
  uri
end

# These timeouts might turn out to be overly-aggressive. We will have
# to see how it goes.
Rails.application.config.core_service_request_open_timeout = ENV['CORESERVICE_OPEN_TIMEOUT'] || 5
Rails.application.config.core_service_request_read_timeout = ENV['CORESERVICE_READ_TIMEOUT'] || 5
