require File.expand_path('../boot', __FILE__)

require 'rails/all'

# Require the default gems and those in the group for the current environment listed in Gemfile,
Bundler.require(:default, Rails.env)

module Storyteller
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.
    config.autoload_paths << Rails.root.join('lib')
    config.autoload_paths << "#{config.root}/app/services/"
    config.autoload_paths << "#{config.root}/app/validators/"
    config.autoload_paths << "#{Rails.root}/../platform-ui/lib"

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    config.i18n.load_path += Dir[Rails.root.join('config', 'locales', '**', '*.{rb,yml}')];
    # config.i18n.default_locale = :de

    # Do not automatically create style, script, or helper files when using rails generate
    config.generators.stylesheets = false
    config.generators.javascripts = false
    config.generators.helper      = false

    # Do not swallow errors in after_commit/after_rollback callbacks.
    config.active_record.raise_in_transactional_callbacks = true

    # Nginx routes urls with /stories from the Open Data platform to this app,
    # so respond to /stories as the root url.
    config.relative_url_root = '/stories'

    # We're using the delayed_job_active_record gem to work the job queue
    config.active_job.queue_adapter = :delayed_job

    # We should be logging to stdout for mesos/sumo
    # Unicorn also writes to STDERR
    config.logger = ActiveSupport::TaggedLogging.new(Logger.new(STDOUT))

    # On exceptions, proceed directly to ErrorsController#show for custom pages.
    config.exceptions_app = ->(env) do
      # Since we're bypassing some other middleware, set these properties so
      # ApplicationController#handle_authorization won't bomb.
      env['action_dispatch.request.path_parameters'] = {
        action: 'show',
        controller: 'errors'
      }
      ErrorsController.action(:show).call(env)
    end
  end
end
