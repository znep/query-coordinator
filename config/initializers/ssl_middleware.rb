require 'rack/ssl-enforcer'

Rails.application.config.middleware.insert_before BlistCookieStore, "CoreServerConnectionMiddleware"
Rails.application.config.middleware.insert_after CoreServerConnectionMiddleware, "CurrentDomainMiddleware"
Rails.application.config.middleware.insert_after CurrentDomainMiddleware, "LocaleMiddleware"
Rails.application.config.middleware.insert_after LocaleMiddleware, "LogRefererMiddleware"
Rails.application.config.middleware.insert_after CurrentDomainMiddleware, Rack::SslEnforcer,
  :https_port => APP_CONFIG['ssl_port'],
  :http_port => APP_CONFIG['http_port'],
  :only => [/^\/login$/, /^\/login\//, /^\/signup$/, /^\/signup\//, /^\/accounts.json/, /^\/account\/add_rpx_token/, /^\/profile\/.*\/update_account/, /^\/oauth/]
