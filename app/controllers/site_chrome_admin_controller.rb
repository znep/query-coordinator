# Admin interface to the custom-styled header/footer (aka site-chrome) settings
class SiteChromeAdminController < ApplicationController
  include ApplicationHelper # request_id
  include CommonSocrataMethods # forwardable_session_cookies

  # TODO: rename to before_action with Rails upgrade
  before_filter :ensure_admin

  def index
    # @site_chromes = SiteChrome.all
  end

  private

  def ensure_admin
    if current_user.present?
      render_forbidden unless is_admin?
    else
      redirect_to(login_url)
    end
  end
end
