class ThemesController < ApplicationController

  layout 'blank'

  def custom
    domain_config = Chrome::SiteChrome.get_core_config
    site_chrome = Chrome::SiteChrome.init_from_core_config(domain_config.config)
    @custom_themes = site_chrome.styles
  end
end
