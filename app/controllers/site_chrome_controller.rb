# Admin interface to the custom-styled header/footer (aka site-chrome) settings
class SiteChromeController < ApplicationController
  include ApplicationHelper # request_id
  include CommonSocrataMethods # forwardable_session_cookies

  # TODO: rename to before_action with Rails upgrade
  before_filter :ensure_admin

  def index
    @site_chromes = SiteChrome.all
  end

  def show
    @site_chrome = SiteChrome.find_one(params[:id])
  end

  def new
    @site_chrome = SiteChrome.new
  end

  def create
    @site_chrome = SiteChrome.new

    @site_chrome.request_id = request_id
    @site_chrome.cookies = forwardable_session_cookies

    if @site_chrome.create
      flash[:success] = 'Site theme created'
      redirect_to site_chrome_path(id: @site_chrome.id)
    else
      render 'new'
    end
  end

  def edit
    @site_chrome = SiteChrome.find_one(params[:id])
  end

  def update
    @site_chrome = SiteChrome.find_one(params[:id])

    @site_chrome.request_id = request_id
    @site_chrome.cookies = forwardable_session_cookies

    # NOTE: this is misleading name for the query param but rolling with it for now
    if @site_chrome.update_published_content(params[:site_chrome][:properties])
      flash[:success] = 'Site theme updated'
      redirect_to site_chrome_path(id: @site_chrome.id)
    else
      render 'edit'
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
end
