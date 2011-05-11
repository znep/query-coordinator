Rails.configuration.middleware.insert_after ActionController::Failsafe, Rack::SslEnforcer, :https_port => APP_CONFIG['ssl_port'], :http_port => APP_CONFIG['http_port']
