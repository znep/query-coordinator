require 'rack/ssl-enforcer'

Rails.application.config.middleware.insert_before SocrataCookieStore, "CoreServerConnectionMiddleware"
Rails.application.config.middleware.insert_after CoreServerConnectionMiddleware, "CurrentDomainMiddleware"
Rails.application.config.middleware.insert_after CurrentDomainMiddleware, "LocaleMiddleware"
Rails.application.config.middleware.insert_after LocaleMiddleware, "LogRefererMiddleware"
Rails.application.config.middleware.insert_after Rails::Rack::Logger, "RequestLoggerMiddleware"
Rails.application.config.middleware.insert_after CurrentDomainMiddleware, Rack::SslEnforcer,
  :https_port => APP_CONFIG.ssl_port,
  :http_port => APP_CONFIG.http_port,
  :except_agents => /GlobalSign/
