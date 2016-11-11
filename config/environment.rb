# Load the Rails application.
require File.expand_path('../application', __FILE__)

module Frontend
  class Application < Rails::Application
    config.middleware.use "HealthCheckMiddleware"

    # Disable rack-cache, as we have ATS and it's entirely redundant. Also, failing randomly.
    config.action_dispatch.rack_cache = nil

    # Set the log file as follows:
    #  - If the RAILS_LOG_FILE environment variable is set, use it.
    #  - Otherwise, use STDOUT for development and log/#{Rails.env}.log otherwise.
    if ENV['RAILS_LOG_FILE'].to_s.upcase == 'STDOUT' || Rails.env.development?
      config.log_file = STDOUT
    else
      config.log_file = (ENV['RAILS_LOG_FILE'].blank?) ? "log/#{Rails.env}.log" : ENV['RAILS_LOG_FILE']
    end

    unless File.exists?(config.log_file)
      FileUtils.mkdir_p(File.dirname(config.log_file))
      FileUtils.touch(config.log_file)
    end
    config.logger = ActiveSupport::TaggedLogging.new(Logger.new(config.log_file))
    config.logger.level = Logger::DEBUG
  end
end

# Initialize the Rails application.
Rails.application.initialize!
