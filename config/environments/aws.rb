# File is here primarily for bin/migration_aws_env.
# Nothing in here really matters.
Rails.application.configure do
  config.cache_classes = false
  config.eager_load = false
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = false
  config.action_mailer.raise_delivery_errors = false
  config.active_support.deprecation = :log
  config.active_record.migration_error = :page_load
  config.assets.debug = false
  config.assets.digest = true
  config.assets.raise_runtime_errors = true
end
