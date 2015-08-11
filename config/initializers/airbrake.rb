require 'addressable/uri'

if ENV['AIRBRAKE_API_KEY'].present?
  Airbrake.configure do |config|
    config.api_key = ENV['AIRBRAKE_API_KEY']
    config.environment_name = ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env
    config.project_id = ENV['AIRBRAKE_PROJECT_ID'] unless ENV['AIRBRAKE_PROJECT_ID'].blank?

    airbrake_http_proxy = ENV['AIRBRAKE_HTTP_PROXY']

    unless airbrake_http_proxy.blank?
      airbrake_http_proxy = "http://#{airbrake_http_proxy}" unless airbrake_http_proxy.starts_with?('http')
      proxy = Addressable::URI.parse(airbrake_http_proxy)

      config.proxy_host = proxy.host
      config.proxy_port = proxy.port
    end

  end
end
