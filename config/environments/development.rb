# Settings specified here will take precedence over those in config/environment.rb

# In the development environment your application's code is reloaded on
# every request.  This slows down response time but is perfect for development
# since you don't have to restart the webserver when you make code changes.
config.cache_classes = false

# Log error messages when you accidentally call methods on nil.
config.whiny_nils = true

# Show full error reports and disable caching
config.action_controller.consider_all_requests_local = true
config.action_view.debug_rjs                         = true
config.action_controller.perform_caching             = false

# Don't care if the mailer can't send
config.action_mailer.raise_delivery_errors = false

config.cache_store = :mem_cache_store, 'localhost', { :namespace => 'webapp' }

# Reload the /lib dir with every request for developers
config.autoload_paths += %W(#{Rails.root}/lib)

# Disable the rails asset cache buster.  This greatly improves the experience with firebug, and development servers
# should have caching disabled anyway.
ENV['RAILS_ASSET_ID'] = ''

# Static asset hosting example: (you'll probably want to redir these to 127.0.0.1 ...)
#config.action_controller.asset_host = StaticAssetBalancer.new("dev1.socratas.com",
#    "dev2.socratas.com", "dev3.socratas.com", "dev4.socratas.com")
