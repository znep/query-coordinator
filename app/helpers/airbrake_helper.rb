module AirbrakeHelper

  def airbrake_config_for_js
    {
      environment: ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      projectId: ENV['AIRBRAKE_PROJECT_ID'],
      projectKey: ENV['AIRBRAKE_API_KEY']
    }
  end
end
