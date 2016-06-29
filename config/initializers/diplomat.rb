Diplomat.configure do |config|
  config.url = Rails.application.config.consul_service_uri
end
