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
  DOWNTIME_MESSAGE = downtime['message']
  DOWNTIME_START   = downtime['start'].present? ? DateTime.parse(downtime['start'].to_s) : nil
  DOWNTIME_END     = downtime['end'].present?   ? DateTime.parse(downtime['end'].to_s) : nil
rescue
  DOWNTIME_MESSAGE = DOWNTIME_START = DOWNTIME_END = nil
end

DOMAIN_TEMPLATES = Dir.glob('app/views/shared/template/_*.html.erb').map do |f|
  f.match(/\/_(\w+)\.html\.erb$/)[1]
end

MASTER_DOMAIN_PREFS = YAML.load_file("#{Rails.root}/config/domain_prefs.yml") || {}
STYLE_PACKAGES = YAML.load_file("#{Rails.root}/config/style_packages.yml") || {}
