require 'rack/ssl-enforcer'

Rails.configuration.middleware.insert_before BlistCookieStore, "CoreServerConnectionMiddleware"
Rails.configuration.middleware.insert_after CoreServerConnectionMiddleware, "CurrentDomainMiddleware"
Rails.configuration.middleware.insert_after CurrentDomainMiddleware, Rack::SslEnforcer,
  :https_port => APP_CONFIG['ssl_port'],
  :http_port => APP_CONFIG['http_port'],
  :only => [/^\/login$/, /^\/login\//, /^\/signup$/, /^\/signup\//, /^\/accounts.json/, /^\/account\/add_rpx_token/, /^\/profile\/.*\/update_account/, /^\/oauth/]
