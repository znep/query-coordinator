require 'core_server/errors'

Airbrake.configure do |config|
  config.api_key = ENV['AIRBRAKE_API_KEY'] || APP_CONFIG.airbrake_api_key
  config.environment_name = ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env

  config.params_filters << "AWS_ACCESS_KEY_ID"
  config.params_filters << "AWS_ACCESS"
  config.params_filters << "AWS_ACCOUNT_NUMBER"
  config.params_filters << "AWS_SECRET_ACCESS_KEY"
  config.params_filters << "AWS_SECRET"
  config.params_filters << "EC2_CERT"
  config.params_filters << "EC2_PRIVATE_KEY"
  config.params_filters << "password"
  config.params_filters << "passwordConfirm"

  # Ignore noisy alerts
  config.ignore << CoreServer::ResourceNotFound
  config.ignore << CoreServer::TimeoutError

  unless ENV['AIRBRAKE_HTTP_PROXY'].to_s.blank?
    proxy = ENV['AIRBRAKE_HTTP_PROXY'].gsub(/https?:\/\//, '').split(':')

    if proxy.length == 2
      config.proxy_host = proxy[0]
      config.proxy_port = proxy[1]
    end
  end
end
