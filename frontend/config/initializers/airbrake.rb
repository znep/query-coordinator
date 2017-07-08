require 'addressable/uri'
require 'core_server/errors'

if ENV['AIRBRAKE_API_KEY'].present? && ENV['AIRBRAKE_PROJECT_ID'].present?
  Airbrake.configure do |config|
    config.project_key = ENV['AIRBRAKE_API_KEY'] || APP_CONFIG.airbrake_api_key
    config.project_id = ENV['AIRBRAKE_PROJECT_ID'] || APP_CONFIG.airbrake_project_id
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

    # Blacklisted keys—specifies which keys in the payload (parameters, session data,
    # environment data, etc) should be filtered. Before sending an error, filtered keys
    # will be substituted with the [Filtered] label.
    # https://github.com/airbrake/airbrake-ruby#blacklist_keys
    %w(
      AWS_ACCESS_KEY_ID
      AWS_ACCESS
      AWS_ACCOUNT_NUMBER
      AWS_SECRET_ACCESS_KEY
      AWS_SECRET
      EC2_CERT
      EC2_PRIVATE_KEY
      password
      passwordConfirm
    ).each { |key| config.blacklist_keys << key }
  end

  # Ignore noisy alerts
  AIRBRAKE_ERRORS_TO_IGNORE = %w(
    CoreServer::ResourceNotFound
    CoreServer::TimeoutError
  ).freeze

  Airbrake.add_filter do |notice|
    if notice[:errors].any? { |error| AIRBRAKE_ERRORS_TO_IGNORE.include?(error[:type]) }
      notice.ignore!
    end
  end

end
