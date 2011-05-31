require 'rack/ssl-enforcer'

Rails.configuration.middleware.insert_after CurrentDomainMiddleware, Rack::SslEnforcer,
  :https_port => APP_CONFIG['ssl_port'],
  :http_port => APP_CONFIG['http_port'],
  :only => [/^\/login/, /^\/signup/, /^\/accounts.json/, /^\/account\/add_rpx_token/, /^\/profile\/.*\/update_account/, /^\/oauth/]
