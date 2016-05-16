# Admin interface to the custom-styled header/footer (aka site-chrome) settings
class SiteChromeController < ApplicationController
  include ApplicationHelper # request_id
  include CommonSocrataMethods # forwardable_session_cookies

  # TODO: rename to before_action with Rails upgrade
  before_filter :ensure_admin
  before_filter :create_site_chrome_if_nil

  def edit
    @tab_sections = %w(general header footer homepage social)
    @site_chrome = SiteChrome.find_or_create_default
    @current_locale = 'en' # TODO
  end

  def update
    @site_chrome = SiteChrome.find_default

    @site_chrome.request_id = request_id
    @site_chrome.cookies = forwardable_session_cookies

    if @site_chrome.update_published_content(params[:content])
      flash[:success] = 'Site theme updated'
      redirect_to site_chrome_path
    elsif @site_chrome.errors.any?
      flash[:success] = "Update was unsuccessful because: #{@site_chrome.errors.inspect}"
      render 'edit', status: :unprocessable_entity
    else
      flash[:success] = "Something went wrong, we're not sure what. Try re-saving."
      render 'edit', status: :internal_server_error
    end
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
      new_site_chrome = SiteChrome.new(site_chrome_default_values)
      new_site_chrome.create
    end
  end
end
