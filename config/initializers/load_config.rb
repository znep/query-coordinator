APP_CONFIG = begin
  conf = YAML.load_file("#{Rails.root}/config/config.yml") || {}
  conf[Rails.env]
end

CORESERVICE_URI = URI.parse(APP_CONFIG['coreservice_uri'])
ODYSSEUS_URI = URI.parse(APP_CONFIG['odysseus_uri'] || "http://localhost:4747")

INTERCESSIO_URI = URI.parse(APP_CONFIG['intercessio_uri'] || "http://localhost:1313" )

revision_file = File.join(Rails.root, "REVISION")

begin
  REVISION_NUMBER = File.open(revision_file, "r").read().chomp()
  REVISION_DATE = File.stat(revision_file).mtime.to_i
rescue
  REVISION_NUMBER = nil
  REVISION_DATE = nil
end

DOWNTIME = { file: File.join(Rails.root, 'config/downtime.yml'), env: Rails.env }
Downtime.update!

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
