if ENV['AIRBRAKE_API_KEY'].present?
  Airbrake.configure do |config|
    config.api_key = ENV['AIRBRAKE_API_KEY']
    config.environment_name = ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env
  end
end
