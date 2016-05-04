# Admin interface to the custom-styled header/footer (aka site-chrome) settings
class SiteThemesController < ApplicationController
  include ApplicationHelper # request_id
  include CommonSocrataMethods # forwardable_session_cookies

  # TODO: rename to before_action with Rails upgrade
  before_filter :ensure_admin

  def index
    @site_themes = SiteTheme.all
  end

  def show
    @site_theme = SiteTheme.find_one(params[:id])
  end

  def new
    @site_theme = SiteTheme.new
  end

  def create
    @site_theme = SiteTheme.new

    @site_theme.request_id = request_id
    @site_theme.cookies = forwardable_session_cookies

    if @site_theme.update_properties(params[:site_theme][:properties])
      flash[:success] = 'Site theme created'
      redirect_to site_theme_path(id: @site_theme.id)
    else
      render 'new'
    end
  end

  def edit
    @site_theme = SiteTheme.find_one(params[:id])
  end

  def update
    @site_theme = SiteTheme.find_one(params[:id])

    @site_theme.request_id = request_id
    @site_theme.cookies = forwardable_session_cookies

    if @site_theme.update_properties(params[:site_theme][:properties])
      flash[:success] = 'Site theme updated'
      redirect_to site_theme_path(id: @site_theme.id)
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
