Recaptcha.configure do |config|
  config.public_key  = ENV['RECAPTCHA_PUBLIC_KEY'] || APP_CONFIG.recaptcha_public_key
  config.private_key = ENV['RECAPTCHA_PRIVATE_KEY'] || APP_CONFIG.recaptcha_private_key
  config.use_ssl_by_default = true
end
