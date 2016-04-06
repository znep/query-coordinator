class SiteChromeController < ApplicationController
  before_filter :get_site_chrome

  def header
    @content = @site_chrome.get_content('header')
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
