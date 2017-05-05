require File.expand_path('../boot', __FILE__)

require 'rails/all'

Bundler.require(*Rails.groups)
require 'socrata_site_chrome'

module Dummy
  class Application < Rails::Application
    config.autoload_paths << Rails.root.join('lib')
    config.autoload_paths += Dir["#{config.root}/lib/**"]

    config.coreservice_uri = Rails.application.config_for(:config)['coreservice_uri']
    config.assets.prefix = '/asset_pipeline'
    config.cache_key_prefix = 'deadbeef'

    # Do not swallow errors in after_commit/after_rollback callbacks.
    config.active_record.raise_in_transactional_callbacks = true
  end
end

