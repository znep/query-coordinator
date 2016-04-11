class ThemesController < ApplicationController

  layout 'blank'

  def custom
    # TODO - move this stuff to a model that this and site_chrome_controller can both use
    domain, email, pass = ENV.values_at(*%w(DOMAIN EMAIL PASS))
    auth = Chrome::Auth.new(domain, email, pass, false).authenticate
    domain_config = Chrome::DomainConfig.new(domain, auth.cookie, true)

    @site_chrome = Chrome::SiteChrome.init_from_core_config(domain_config.config)
    @custom_themes = @site_chrome.styles
  end
end
