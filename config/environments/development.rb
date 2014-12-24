Frontend::Application.configure do
  # Settings specified here will take precedence over those in config/application.rb

  # In the development environment your application's code is reloaded on
  # every request, so rails doesn't need to be restarted every time code is changed.
  # However, do note that this can hide cross-request bugs (not hypothetical, see CORE-1806).
  config.cache_classes = false

  # Log error messages when you accidentally call methods on nil.
  config.whiny_nils = true

  # Show full error reports and disable caching
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = false

  config.cache_store = :mem_cache_store, 'localhost', { :namespace => 'webapp' }

  # Don't care if the mailer can't send
  # config.action_mailer.raise_delivery_errors = false

  # Print deprecation notices to the Rails logger
  config.active_support.deprecation = :log

  # Only use best-standards-support built into browsers
  config.action_dispatch.best_standards_support = :builtin

  # Static asset hosting example: (you'll probably want to redir these to 127.0.0.1 ...)
  #config.action_controller.asset_host = StaticAssetBalancer.new("dev1.socratas.com",
  #    "dev2.socratas.com", "dev3.socratas.com", "dev4.socratas.com")

  # config.middleware.use "Graylog2Exceptions", :hostname => 'graylog2.sea1.socrata.com', :facility => 'frontend'
  # Raise exception on mass assignment protection for Active Record models
  # config.active_record.mass_assignment_sanitizer = :strict

  # Log the query plan for queries taking more than this (works
  # with SQLite, MySQL, and PostgreSQL)
  # config.active_record.auto_explain_threshold_in_seconds = 0.5

  # Do not compress assets
  config.assets.compress = false

  # Expands the lines which load the assets
  config.assets.debug = true
end
