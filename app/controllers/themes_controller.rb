class ThemesController < ApplicationController

  layout 'blank'

  def custom
    domain_config = Chrome::DomainConfig.new(ENV['DOMAIN'], localhost?)
    site_chrome_config = domain_config.to_site_chrome_config
    site_chrome = Chrome::SiteChrome.new(site_chrome_config)
    @custom_themes = site_chrome.styles
  end
end
