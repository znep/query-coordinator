class ThemesController < ApplicationController

  layout 'blank'

  def custom
    # TODO - move this stuff to a model that this and site_chrome_controller can both use
    domain = ENV['DOMAIN']
    user = ENV['EMAIL']
    pass = ENV['PASS']
    auth = Chrome::Auth.new(domain, user, pass, false).authenticate
    domain_config = Chrome::DomainConfig.new(ENV['DOMAIN'], auth.cookie, true)

    @site_chrome = Chrome::SiteChrome.init_from_core_config(domain_config.config)
    @custom_themes = @site_chrome.styles
  end
end
