require 'core_server/errors'
Airbrake.configure do |config|
  config.api_key = '2aa9cf5b8e41f462f46fe1cfd07aed69'
  config.ignore       << CoreServer::ResourceNotFound
end
