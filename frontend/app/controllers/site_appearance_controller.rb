# Admin interface to the custom-styled header/footer (aka site-chrome) settings
class SiteAppearanceController < ApplicationController

  include ApplicationHelper # request_id
  include CommonSocrataMethods # forwardable_session_cookies

  # TODO: rename to before_action with Rails upgrade
  before_filter :ensure_access
  before_filter :fetch_site_appearance_content

  def tab_sections
    # EN-6943: removing "homepage" because it is not implemented yet
    %w(whats_new general header footer social)
  end
  helper_method :tab_sections

  def edit
  end

  def update
    @site_appearance = SiteAppearance.site_chrome_config_exists? ?
      SiteAppearance.find :
      SiteAppearance.create_site_chrome_config(forwardable_session_cookies)

    @site_appearance.request_id = request_id
    @site_appearance.cookies = forwardable_session_cookies

    # The site_appearance params represent the radio buttons for activation of site chrome in the form.
    # We only want to apply these if the activation param is also present. By default this param is not
    # present unless the Activate button is pressed. This allows for updating the site chrome configuration
    # for either preview, or for pre-launch configuration by Socrata, without inadvertent activation.
    if params[:site_appearance] && (@site_appearance.activated? || params[:activation])
      @site_appearance.set_activation_state(params[:site_appearance])
    end

    update_successful = @site_appearance.update_content(params[:stage] || :published, params[:content])

    if update_successful
      if params[:stage] == 'draft'
        cookies[:socrata_site_chrome_preview] = true
        redirect_to browse_path
      else
        flash[:notice] = 'Site theme updated'
        cookies.delete(:socrata_site_chrome_preview)
        redirect_to edit_site_appearance_path
      end
    elsif @site_appearance.errors.any?
      flash[:error] = "Update was unsuccessful because: #{@site_appearance.errors.inspect}"
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

  # Use existing Site Chrome config or instantiate a new one with the default content
  def fetch_site_appearance_content
    @site_appearance = existing_site_chrome_config_has_content? ? SiteAppearance.find : SiteAppearance.new

    # Ensure site_chrome has content necessary for rendering plain views
    @content = @site_appearance.content(site_chrome_published_mode?) || {}
    %w(header footer general locales).each do |key|
      @content[key] ||= {}
    end
  end

  # EN-12237: Check that a Site Chrome config exists, and it is populated with valid Site Chrome data
  def existing_site_chrome_config_has_content?
    SiteAppearance.find.try(:content, site_chrome_published_mode?).present?
  end
end
