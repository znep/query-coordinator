class SiteChromeController < ApplicationController
  def index
    @site_chrome = get_site_chrome
    @header = @site_chrome.header
    @footer = @site_chrome.footer
    @general = @site_chrome.general
    @locales = @site_chrome.locales
    @current_user = @site_chrome.current_user(request)
  end

  private

  def get_site_chrome
    domain_config = Chrome::DomainConfig.new(ENV['DOMAIN'], localhost?)
    site_chrome_config = domain_config.to_site_chrome_config
    Chrome::SiteChrome.new(site_chrome_config)
  end
end
