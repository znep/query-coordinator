HoptoadNotifier.configure do |config|
  config.api_key = '2aa9cf5b8e41f462f46fe1cfd07aed69'
  config.environment_filters << "AWS_ACCESS_KEY_ID"
  config.environment_filters << "AWS_ACCESS"
  config.environment_filters << "AWS_ACCOUNT_NUMBER"
  config.environment_filters << "AWS_SECRET_ACCESS_KEY"
  config.environment_filters << "AWS_SECRET"
  config.environment_filters << "EC2_CERT"
  config.environment_filters << "EC2_PRIVATE_KEY"

  config.ignore       << CoreServer::ResourceNotFound
end
