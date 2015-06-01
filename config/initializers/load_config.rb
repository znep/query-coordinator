# Values in this config will only be picked up on deploy.
APP_CONFIG = begin
  conf = YAML.load_file("#{Rails.root}/config/config.yml") || {}
  conf[Rails.env]
end

Rails.logger.info JSON.pretty_generate(APP_CONFIG)

CORESERVICE_URI = URI.parse(APP_CONFIG['coreservice_uri'])
ODYSSEUS_URI = URI.parse(APP_CONFIG['odysseus_uri'] || "http://localhost:4747")

INTERCESSIO_URI = URI.parse(APP_CONFIG['intercessio_uri'] || "http://localhost:1313" )

revision_file = File.join(Rails.root, "REVISION")

begin
  REVISION_NUMBER = File.read(revision_file).chomp()
  REVISION_DATE = File.stat(revision_file).mtime.to_i
rescue
  REVISION_NUMBER = nil
  REVISION_DATE = nil
end

begin
  assets = YAML.load_file(File.join(Rails.root, "config/assets.yml"))
  ASSET_MAP = AssetMapper.new(assets, assets['dump'])
rescue
  ASSET_MAP = AssetMapper.new(nil, nil)
end

begin
  VIDEO_LIST = YAML.load_file(File.join(Rails.root, "config/videos.yml"))
rescue
  VIDEO_LIST = []
end

DOMAIN_TEMPLATES = Dir.glob('app/views/shared/template/_*.html.erb').map do |f|
  f.match(/\/_(\w+)\.html\.erb$/)[1]
end

STYLE_PACKAGES = YAML.load_file("#{Rails.root}/config/style_packages.yml") || {}

FEATURE_FLAGS = YAML.load_file("#{Rails.root}/config/feature_flags.yml") || {}

AUTH0_URI = APP_CONFIG['auth0_uri']
AUTH0_ID = APP_CONFIG['auth0_id']
AUTH0_SECRET = APP_CONFIG['auth0_secret']
AUTH0_CONFIGURED = !(AUTH0_URI.nil? || AUTH0_ID.nil? || AUTH0_SECRET.nil?)

# Values in these configs will be picked up when their files are written to.
{ downtime: { klass: DowntimeConfig, filename: "#{Rails.root}/config/downtime.yml" }
}.collect { |uniqId, definition| definition[:klass].new(uniqId, definition[:filename]) }
