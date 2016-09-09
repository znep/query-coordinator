# Admin interface to the custom-styled header/footer (aka site-chrome) settings
class SiteChromeController < ApplicationController

  include ApplicationHelper # request_id
  include CommonSocrataMethods # forwardable_session_cookies

  # TODO: rename to before_action with Rails upgrade
  before_filter :ensure_access
  before_filter :find_or_create_default_site_chrome

  def tab_sections
    # EN-6943: removing "homepage" because it is not implemented yet
    %w(whats_new general header footer social)
  end
  helper_method :tab_sections

  def edit
  end

  def update
    @site_chrome.request_id = request_id
    @site_chrome.cookies = forwardable_session_cookies

    # The site_appearance params represent the radio buttons for activation of site chrome in the form.
    # We only want to apply these if the activation param is also present. By default this param is not
    # present unless the Activate button is pressed. This allows for updating the site chrome configuration
    # for either preview, or for pre-launch configuration by Socrata, without inadvertent activation.
    if params[:site_appearance] && (@site_chrome.activated? || params[:activation])
      @site_chrome.set_activation_state(params[:site_appearance])
    end

    if @site_chrome.update_content(params[:stage] || :published, params[:content])
      if params[:stage] == 'draft'
        cookies[:socrata_site_chrome_preview] = true
        redirect_to browse_path
      else
        flash[:notice] = 'Site theme updated'
        cookies.delete(:socrata_site_chrome_preview)
        redirect_to edit_site_chrome_path
      end
    elsif @site_chrome.errors.any?
      flash[:error] = "Update was unsuccessful because: #{@site_chrome.errors.inspect}"
      render 'edit', status: :unprocessable_entity
    else
      flash[:error] = "Something went wrong, we're not sure what. Please try saving again."
      render 'edit', status: :internal_server_error
    end
  end

  private

  def ensure_access
    if current_user.present?
      render_forbidden unless current_user.can_use_site_appearance?
    else
      redirect_to(login_url)
    end
  end

  # If site chrome doesn't yet exist, create a new one
  def find_or_create_default_site_chrome
    @site_chrome = SiteChrome.find_or_create_default(forwardable_session_cookies)

    # Ensure site_chrome has content necessary for rendering plain views
    @content = @site_chrome.send(in_preview_mode? ? :draft_content : :published_content) || {}
    %w(header footer general locales).each do |key|
      @content[key] ||= {}
    end
  end

end
