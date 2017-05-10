Rails.application.config.middleware.insert_before CurrentDomainMiddleware, "VersionMiddleware"
