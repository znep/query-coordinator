if APP_CONFIG.feature_flag_signaller_uri.present?
  Signaller.configure do |config|
    config.base_uri = APP_CONFIG.feature_flag_signaller_uri
    config.cache = Rails.cache
    config.logger = Rails.logger
  end
end

if APP_CONFIG.feature_flag_monitor_uri.present?
  FeatureFlagMonitor.configure do |config|
    config.consul_uri = APP_CONFIG.consul_host
    config.feature_flag_monitor_uri = APP_CONFIG.feature_flag_monitor_uri
  end
end
