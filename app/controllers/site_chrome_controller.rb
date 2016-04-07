class SiteChromeController < ApplicationController
  before_filter :get_site_chrome

  def header
    @header = @site_chrome.header
    @general = @site_chrome.general
    @locales = @site_chrome.locales
  end

  def footer
    @footer = @site_chrome.footer
    @general = @site_chrome.general
    @locales = @site_chrome.locales
  end

  private

  def get_site_chrome
    domain = ENV['DOMAIN']
    user = ENV['EMAIL']
    pass = ENV['PASS']
    auth = Chrome::Auth.new(domain, user, pass, false).authenticate
    domain_config = Chrome::DomainConfig.new(ENV['DOMAIN'], auth.cookie, true)
    @site_chrome = Chrome::SiteChrome.init_from_core_config(domain_config.config)
  end
end
