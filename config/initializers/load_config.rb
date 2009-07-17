APP_CONFIG = begin
  conf = YAML.load_file("#{RAILS_ROOT}/config/config.yml") || {}
  conf[Rails.env]
end

CORESERVICE_URI = URI.parse(APP_CONFIG['coreservice_uri'])

MULTIUSER_SECRET = "zomg dont tell anyone"
MULTIUSER_BRIDGE_HOST  = APP_CONFIG["bridge_host"]
MULTIUSER_BRIDGE_PORT  = APP_CONFIG["bridge_port"]
MULTIUSER_ORBITED_PORT = APP_CONFIG["orbited_port"]
MULTIUSER_IE_PORT      = APP_CONFIG["ie_port"]

SWF_DIR = File.join(File.dirname(Rails.root), 'rails/public/swf')

BLIST_RSS = APP_CONFIG["blist_blog_rss"]

revision_file = ["#{RAILS_ROOT}/../REVISION_FLEX", "#{RAILS_ROOT}/../REVISION"].detect do |filename|
  File.exist?(filename)
end

begin
  REVISION_NUMBER = File.open(revision_file, "r").read().chomp()
  REVISION_DATE = File.stat(revision_file).mtime.to_i
rescue
  REVISION_NUMBER = nil
  REVISION_DATE = nil
end

