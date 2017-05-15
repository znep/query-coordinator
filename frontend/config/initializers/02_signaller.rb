if APP_CONFIG.feature_flag_signaller_uri.present?
  Signaller.configure do |config|
    config.base_uri = APP_CONFIG.feature_flag_signaller_uri
    config.cache = Rails.cache
    config.logger = Rails.logger
  end
end
