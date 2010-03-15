APP_CONFIG = begin
  conf = YAML.load_file("#{Rails.root}/config/config.yml") || {}
  conf[Rails.env]
end

CORESERVICE_URI = URI.parse(APP_CONFIG['coreservice_uri'])

BLIST_RSS = APP_CONFIG["blist_blog_rss"]

revision_file = File.join(Rails.root, "REVISION")

begin
  REVISION_NUMBER = File.open(revision_file, "r").read().chomp()
  REVISION_DATE = File.stat(revision_file).mtime.to_i
rescue
  REVISION_NUMBER = nil
  REVISION_DATE = nil
end

DOMAIN_TEMPLATES = Dir.glob('app/views/shared/template/_*.html.erb').map do |f|
  f.match(/\/_(\w+)\.html\.erb$/)[1]
end
