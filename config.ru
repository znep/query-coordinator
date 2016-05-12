# This file is used by Rack-based servers to start the application.

require ::File.expand_path('../config/environment', __FILE__)
use CurrentDomainMiddleware
map Chrome::Engine.config.relative_url_root = '/stories' do
  run Rails.application
end
