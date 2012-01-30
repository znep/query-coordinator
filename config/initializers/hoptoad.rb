HoptoadNotifier.configure do |config|
  config.api_key = '2aa9cf5b8e41f462f46fe1cfd07aed69'
  config.params_filters << "AWS_ACCESS_KEY_ID"
  config.params_filters << "AWS_ACCESS"
  config.params_filters << "AWS_ACCOUNT_NUMBER"
  config.params_filters << "AWS_SECRET_ACCESS_KEY"
  config.params_filters << "AWS_SECRET"
  config.params_filters << "EC2_CERT"
  config.params_filters << "EC2_PRIVATE_KEY"
  config.params_filters << "password"
  config.params_filters << "passwordConfirm"

  # config.ignore       << CoreServer::ResourceNotFound
end
