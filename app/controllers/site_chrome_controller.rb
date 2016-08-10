# Admin interface to the custom-styled header/footer (aka site-chrome) settings
class SiteChromeController < ApplicationController
  include ApplicationHelper # request_id
  include CommonSocrataMethods # forwardable_session_cookies

  # TODO: rename to before_action with Rails upgrade
  before_filter :ensure_admin
  before_filter :find_or_create_default_site_chrome

  def tab_sections
    # EN-6943: removing "homepage" because it is not implemented yet
    %w(general header footer social)
  end
  helper_method :tab_sections

  def edit
  end

  def update
    @site_chrome.request_id = request_id
    @site_chrome.cookies = forwardable_session_cookies

    if @site_chrome.update_content(params[:stage] || :published, params[:content])
      flash[:notice] = 'Site theme updated'
      if params[:stage] == 'draft'
        cookies[:socrata_site_chrome_preview] = true
        redirect_to browse_path
      else
        redirect_to edit_site_chrome_path
      end
    elsif @site_chrome.errors.any?
      flash[:error] = "Update was unsuccessful because: #{@site_chrome.errors.inspect}"
      render 'edit', status: :unprocessable_entity
    else
      flash[:error] = "Something went wrong, we're not sure what. Try re-saving."
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
  def find_or_create_default_site_chrome
    @site_chrome = SiteChrome.find_or_create_default(forwardable_session_cookies)

    # Ensure site_chrome has content necessary for rendering plain views
    @content = @site_chrome.content || {}
    %w(header footer general locales).each do |key|
      @content[key] ||= {}
    end
  end
end
