# Admin interface to the custom-styled header/footer (aka site-chrome) settings
class SiteChromeAdminController < ApplicationController
  include ApplicationHelper # request_id
  include CommonSocrataMethods # forwardable_session_cookies

  # TODO: rename to before_action with Rails upgrade
  before_filter :ensure_admin, :create_site_chrome_if_nil

  def index
    @tab_sections = %w(general header footer homepage social)
    @site_chrome = SiteChrome.find_default
  end

  private

  def ensure_admin
    if current_user.present?
      render_forbidden unless is_admin?
    else
      redirect_to(login_url)
    end
  end

  # If site chrome doesn't yet exist, create a new one
  def create_site_chrome_if_nil
    unless SiteChrome.find_default.present?
      new_site_chrome = SiteChrome.new
      new_site_chrome.create
      # TODO - get default_values and verify this works
      # new_site_chrome.update_property = { 'siteChromeConfigVars' => default_values }
    end
  end
end
