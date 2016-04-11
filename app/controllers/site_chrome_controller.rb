class SiteChromeController < ApplicationController
  before_filter :get_site_chrome

  def index
    @header = @site_chrome.header
    @footer = @site_chrome.footer
    @general = @site_chrome.general
    @locales = @site_chrome.locales
  end

  private

  def get_site_chrome
    domain_config = Chrome::SiteChrome.get_core_config
    @site_chrome = Chrome::SiteChrome.init_from_core_config(domain_config.config)
  end
end
