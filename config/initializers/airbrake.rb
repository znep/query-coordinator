require 'addressable/uri'

Airbrake.configure do |config|
  config.project_key = ENV['AIRBRAKE_API_KEY'] || 'unconfigured'
  config.project_id = ENV['AIRBRAKE_PROJECT_ID'] || 'unconfigured'
  config.environment = ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env
  config.ignore_environments = %w(development test)

  airbrake_http_proxy = ENV['AIRBRAKE_HTTP_PROXY']
  unless airbrake_http_proxy.blank?
    airbrake_http_proxy = "http://#{airbrake_http_proxy}" unless airbrake_http_proxy.starts_with?('http')
    proxy = Addressable::URI.parse(airbrake_http_proxy)

    config.proxy = {
      host: proxy.host,
      port: proxy.port
    }
  end
end

Airbrake.add_filter do |notice|
  # Merge additional useful params into the notice.
  default_payload = AirbrakeNotifier.default_payload
  [:context, :environment, :params].each do |category|
    # set values with defaults if they're not already set (reverse_merge)
    notice[category].reverse_merge!(default_payload[category]) unless default_payload[category].blank?
  end
end
