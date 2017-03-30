module AirbrakeHelper

  def airbrake_config_for_js
    {
      ENVIRONMENT_NAME: ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      PROJECT_ID: ENV['AIRBRAKE_PROJECT_ID'],
      API_KEY: ENV['AIRBRAKE_API_KEY']
    }
  end
end
