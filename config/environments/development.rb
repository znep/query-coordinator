Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # In the development environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Do not eager load code on boot.
  config.eager_load = false

  # Show full error reports and disable caching.
  config.consider_all_requests_local       = true

  # We turn on caching in development mode so our custom theme SASS generation
  # is manageable.
  config.action_controller.perform_caching = ENV['DISABLE_CACHE'] != 'true'
  config.cache_store = :mem_cache_store, ENV['MEMCACHED_HOST'] || 'localhost', { :namespace => 'storyteller' }


  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Debug mode disables concatenation and preprocessing of assets.
  # This option may cause significant delays in view rendering with a large
  # number of complex assets.
  config.assets.debug = true

  # Asset digests allow you to set far-future HTTP expiration dates on all assets,
  # yet still be able to expire them through the digest params.
  config.assets.digest = true

  # Adds additional error checking when serving assets at runtime.
  # Checks for improperly declared sprockets dependencies.
  # Raises helpful error messages.
  config.assets.raise_runtime_errors = true

  # Raises error for missing translations
  # config.action_view.raise_on_missing_translations = true

  # Our uploaded file storage config
  config.paperclip_defaults = {
    :storage => :s3,
    :s3_credentials => {
      :bucket =>            Rails.application.secrets.aws['s3_bucket_name'],
      :access_key_id =>     Rails.application.secrets.aws['access_key_id'],
      :secret_access_key => Rails.application.secrets.aws['secret_access_key']
    },
    :s3_protocol => 'https'
  }

  config.action_controller.action_on_unpermitted_parameters = :raise
end
