# This file is underscore-prefixed because Rails loads initializers in alphabetical order,
# and other initializers may need to rely on these variables for further configuration.

Rails.application.config.coreservice_uri = begin
  uri = ENV['CORESERVICE_URI'] || 'http://localhost:8080'
  uri = "http://#{uri}" unless uri.starts_with?('http')
  uri
end

Rails.application.config.core_service_app_token = ENV['CORESERVICE_APP_TOKEN']

# These timeouts might turn out to be overly-aggressive. We will have to see how it goes.
Rails.application.config.core_service_request_open_timeout = ENV['CORESERVICE_OPEN_TIMEOUT'] || 5
Rails.application.config.core_service_request_read_timeout = ENV['CORESERVICE_READ_TIMEOUT'] || 5

# Base URI for Cetera in the current ENV
Rails.application.config.cetera_service_uri = ENV['CETERA_SERVICE_URI'] || 'http://localhost:5704'

# Base URI for the consul server in the current ENV
Rails.application.config.consul_service_uri = ENV['CONSUL_SERVICE_URI'] || 'http://localhost:8500'
Rails.application.config.consul_service_timeout = (ENV['CONSUL_SERVICE_TIMEOUT_SECONDS'] || 2).to_i

# The environment name that maps to the frontend's downtime config in Consul
Rails.application.config.downtime_config_env = ENV['DOWNTIME_CONFIG_ENV'] || Rails.env

Rails.application.config.odysseus_service_uri = ENV['ODYSSEUS_SERVICE_URI'] || 'http://localhost:4747'