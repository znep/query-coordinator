# Values in this config will only be picked up on deploy.
APP_CONFIG = begin
  conf = YAML.load_file("#{Rails.root}/config/config.yml") || {}
  AppConfig.new(conf[Rails.env])
end

CORESERVICE_URI = URI.parse(APP_CONFIG.coreservice_uri)

revision_file = File.join(Rails.root, 'REVISION')

begin
  REVISION_NUMBER = File.read(revision_file).chomp
  REVISION_DATE = File.stat(revision_file).mtime.to_i
rescue
  REVISION_NUMBER = nil
  REVISION_DATE = nil
end

cheetah_revision_file = File.join(Rails.root, 'CHEETAH_REVISION')
# default to '' instead of nil since this is how we had to implement it for Core
CHEETAH_REVISION_NUMBER = File.exist?(cheetah_revision_file) && File.read(cheetah_revision_file).chomp || ''

begin
  VIDEO_LIST = YAML.load_file(File.join(Rails.root, 'config/videos.yml'))
rescue
  VIDEO_LIST = []
end

DOMAIN_TEMPLATES = Dir.glob('app/views/shared/template/_*.html.erb').map do |f|
  f.match(/\/_(\w+)\.html\.erb$/)[1]
end

STYLE_PACKAGES = YAML.load_file("#{Rails.root}/config/style_packages.yml") || {}

AUTH0_URI = ENV['AUTH0_URI'] || APP_CONFIG.auth0_uri
AUTH0_ID = ENV['AUTH0_ID'] || APP_CONFIG.auth0_id
AUTH0_SECRET = ENV['AUTH0_SECRET'] || APP_CONFIG.auth0_secret
AUTH0_DATABASE_CONNECTION = ENV['AUTH0_DATABASE_CONNECTION'] || APP_CONFIG.auth0_database_connection
AUTH0_CONFIGURED = AUTH0_URI.present? && AUTH0_ID.present? && AUTH0_SECRET.present?

unless AUTH0_CONFIGURED
  missing_variables = []

  missing_variables.push('AUTH0_URI') if AUTH0_URI.nil?
  missing_variables.push('AUTH0_ID') if AUTH0_ID.nil?
  missing_variables.push('AUTH0_SECRET') if AUTH0_SECRET.nil?

  Airbrake.notify(
    :error_class => 'Auth0MissingEnvironmentVariableError',
    :error_message => "Auth0: Missing environment variables in frontend's configuration: #{missing_variables.join(', ')}"
  ) if missing_variables.present?
end

RECAPTCHA_2_SITE_KEY = ENV['RECAPTCHA_2_SITE_KEY'] || APP_CONFIG.recaptcha_2_site_key
RECAPTCHA_2_SECRET_TOKEN = ENV['RECAPTCHA_2_SECRET_TOKEN'] || APP_CONFIG.recaptcha_2_secret_token

GOOGLE_MAPS_SITE_KEY = ENV['GOOGLE_MAPS_SITE_KEY'] || APP_CONFIG.google_maps_site_key

if Rails.env.development?
  OpenSSL::SSL.send(:remove_const, :VERIFY_PEER)
  OpenSSL::SSL::VERIFY_PEER = OpenSSL::SSL::VERIFY_NONE
end
