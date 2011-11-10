APP_CONFIG = begin
  conf = YAML.load_file("#{Rails.root}/config/config.yml") || {}
  conf[Rails.env]
end

CORESERVICE_URI = URI.parse(APP_CONFIG['coreservice_uri'])

revision_file = File.join(Rails.root, "REVISION")

begin
  REVISION_NUMBER = File.open(revision_file, "r").read().chomp()
  REVISION_DATE = File.stat(revision_file).mtime.to_i
rescue
  REVISION_NUMBER = nil
  REVISION_DATE = nil
end

begin
  downtime = YAML.load_file(File.join(Rails.root, "config/downtime.yml"))
  DOWNTIME = Downtime.new(downtime['start'], downtime['end'], downtime['message'])
rescue
  DOWNTIME = Downtime.new(nil, nil, nil)
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

MASTER_DOMAIN_PREFS = YAML.load_file("#{Rails.root}/config/domain_prefs.yml") || {}
STYLE_PACKAGES = YAML.load_file("#{Rails.root}/config/style_packages.yml") || {}
STYLE_MAP = {}
STYLE_PACKAGES.each do |name, sheets|
  STYLE_MAP[name] = Rails.env == 'development' ? sheets.map { |req| "/styles/individual/#{req}.css" } :
         "/styles/merged/#{name.to_s}.css?#{REVISION_NUMBER}"
end
