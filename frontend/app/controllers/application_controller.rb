# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  include ApplicationHelper
  include ActionControllerExtensions
  include UserAuthMethods
  include ActionController::Caching::Pages
  include FrameEmbedding

  class BadParametersError < StandardError; end

  self.page_cache_directory = "#{Rails.root}/public/page_cache"

  def current_domain
    CurrentDomain
  end

  before_filter :hook_auth_controller, :create_core_server_connection,
    :disable_frame_embedding, :adjust_format, :patch_microsoft_office,
    :sync_logged_in_cookie, :require_user, :set_user, :set_meta,
    :force_utf8_params, :poll_external_configs, :set_request_id,
    :set_cookies

  helper :all # include all helpers, all the time

  helper_method :current_user
  helper_method :current_user_json
  helper_method :current_user_session
  helper_method :current_domain

  layout 'main'

  rescue_from CoreServer::Unauthorized, :with => :render_401
  rescue_from CoreServer::ResourceNotFound, :with => :render_404
  rescue_from ActionView::MissingTemplate, :with => :render_406 unless Rails.env.development?
  rescue_from ApplicationController::BadParametersError, :with => :render_400

  # Prevent CSRF attacks by raising an exception.
  protect_from_forgery with: :exception

  def valid_authenticity_token?(session, encoded_masked_token)
    session['init'] = true unless session.loaded?
    super
  end
  protected :valid_authenticity_token?

  def handle_unverified_request
    # As of Rails 2.3.11 (and in 3.0.4), the CSRF protection behavior
    # has changed. No longer will it balk and refuse to service your
    # request -- instead, they'll clear your user session and continue
    # on their merry, and so the request will be serviced as if you had
    # been logged out. This would be fantastic! if we used Rails
    # sessions to keep track of user auth. But we don't. So we have to
    # monkey patch in some shenanigans.
    super

    # Log the user out a dozen different ways
    if current_user_session
      current_user_session.destroy
    end
    cookies.delete :remember_token
    cookies.delete :logged_in

    @current_user = nil
    @current_user_session = nil

    error = 'A request was made without the appropriate Authenticity Token. ' +
      'This usually means that someone is attempting to do something malicious with your account. ' +
      'For your protection, you have been logged out. Please contact support if the problem persists.'
    respond_to do |format|
      format.html do
        flash.now[:error] = error
        render 'shared/error', :status => :unauthorized
      end
      format.data { render :json => { :error => error } }
    end
  end

  def require_module!(name)
    render_404 unless CurrentDomain.module_enabled?(name.to_s)
  end

  def require_that(enabled)
    render_404 unless enabled
  end

  # Rails override so if you provide a locale of nyan we will nyan everything
  def translate(*args)
    if I18n.locale == :nyan
      'nyan'
    else
      super
    end
  end
  alias :t :translate

  # Patch the page caching support to handle our dynamic domain support.
  # (ie: the cache ends up in a directory based on the locale set via
  # the configure_theme parameter, and Apache uses the domain name of the
  # request to determine which directory to serve.)
  def self.cache_page(content, path)
    super(content, CurrentDomain.cname + path)
  end

  def self.expire_page(path)
    super(CurrentDomain.cname + path)
  end

  def require_right(right)
    if CurrentDomain.user_can?(current_user, right)
      return true
    else
      render_forbidden
      return false
    end
  end

  def is_superadmin?
    !!current_user.try(:is_superadmin?)
  end

  def show_nbe_redirection_warning?
    feature_flags = FeatureFlags.derive(@view, request)
    (is_superadmin? || feature_flags.disable_obe_redirection) &&
      !feature_flags.disable_nbe_redirection_warning_message
  end

  def disable_site_chrome?
    false
  end

  protected

  # v4 chrome style error messages
  def render_forbidden(message = I18n.t('core.auth.need_permission'))
    flash.now[:error] = message
    render 'shared/error', :status => :forbidden
  end

  def render_invalid
    flash.now[:error] = 'Invalid request'
    render 'shared/bad_request', :status => 400, :layout => 'error'
  end

  # We use a custom page_cache_directory based on the theme of the site.
  # The builtin rails page_cache_file function is broken with this type of
  # implementation...
  def self.page_cache_file(path)
    if path == CurrentDomain.cname || path == CurrentDomain.cname + '/'
      name = path += '/index'
    else
      name = URI.unescape(path.chomp('/'))
    end

    name << page_cache_extension unless (name.split('/').last || name).include? '.'
    name
  end

  def meter(name)
    ActiveSupport::Notifications.instrument :meter, :measurement => name
  end

  # +before_filter+
  def set_user
    if current_user_session
      @current_user = current_user_session.user
    end
    RequestStore[:current_user] = @current_user.try(:data)
  end

  # +before_filter+
  def set_request_id
    Socrata::RequestIdHelper.current_request_id = request_id
  end

  # +before_filter+
  def set_cookies
    Socrata::CookieHelper.current_cookies = forwardable_session_cookies
  end

  private

  # create the connection that can be used by all core server calls
  # made by this request
  # +before_filter+
  def create_core_server_connection
    CoreServer::Base.connection = CoreServer::Connection.new(Rails.logger, cookies)
  end

  # +before_filter+
  def sync_logged_in_cookie
    cookies.delete(:logged_in) unless current_user
  end

  def auth0_redirect_configured?
    properties = CurrentDomain.configuration('auth0').try(:properties)
    properties.present? && properties.auth0_always_redirect_connection.present?
  rescue StandardError
    false
  end

  # +before_filter+
  def require_user(force_login = false)
    unless current_user_session && !force_login
      if @suppress_chrome
        render_forbidden(I18n.t('core.auth.need_permission'))
      else
        store_location
        flash[:notice] = I18n.t('core.auth.need_login') unless auth0_redirect_configured?
        redirect_to login_url
      end
      return false
    end
  end

  # +before_filter+
  def set_meta
    # Set site meta tags as appropriate
    @meta = {
      :title => get_site_title,
      'og:title' => get_site_title,
      'og:site_name' => CurrentDomain.strings.company,
      :description => CurrentDomain.strings.meta_description,
      'og:description' => CurrentDomain.strings.meta_description,
      'og:type' => 'article',
      'og:url' => request.url
    }

    additional_meta = CurrentDomain.theme[:meta]
    if additional_meta.present? && additional_meta.is_a?(Hash)
      @meta.merge!(additional_meta)
    end

    # EN-6285 - Address Frontend app Airbrake errors
    #
    # This change attempts to read :logo_square using a .try() chain as opposed
    # to CurrentDomain.theme[:images][:logo_square], which will hopefully
    # prevent future NoMethodErrors from reaching Airbrake.
    #
    # The fact that the very next line checks if logo_square is present gives
    # me confidence that this change is consistent with the original intent of
    # the code.
    logo_square = CurrentDomain.theme.try(:[], :images).try(:[], :logo_square)
    if logo_square.present?
      @link_image_src = if logo_square[:type].to_s == "static"
        logo_square[:href]
      elsif logo_square[:type].to_s == "hosted"
        "/assets/#{logo_square[:href]}"
      end
      # This is mostly because I don't trust FB to handle it correctly otherwise.
      @meta['og:image'] = "//#{CurrentDomain.cname}#{@link_image_src}"
    end
  end

  def check_lockdown
    if globalsign_user_agent?
      # Render a skeleton page with just the GlobalSign domain validator value if their bot is hitting us.
      # Unrelated to the staging lockdown, but this is a convenient place to do this check.
      # Note that the selection of shared/error here is arbitrary as it won't actually render,
      # but Rails requires a valid page to be specified.
      return render('shared/error', :layout => 'globalsign')
    elsif CurrentDomain.feature? :staging_lockdown
      if current_user.nil?
        return require_user(true)
      elsif !CurrentDomain.member?(current_user)
        return render_forbidden
      end
    end
  end

  def globalsign_user_agent?
    request.env["HTTP_USER_AGENT"] && request.env["HTTP_USER_AGENT"][/(GlobalSign)/]
  end

  def store_location
    session[:return_to] = request.fullpath
  end

  def redirect_to(options = {}, response_status = {})
    logger.info("Redirecting from #{request.path} to #{options}, referred from #{request.referrer || 'unknown referrer'}")
    super
  end

  def redirect_back_or_default(path)
    redirect_to(session[:return_to] || path)
    session[:return_to] = nil
  end

  # +before_filter+
  # TODO Factor out duplicate but differently named method in storyteller: "require_super_admin_user"
  def require_superadmin
    unless current_user.try(:flags).to_a.any? { |flag| flag.to_s == 'admin' }
      redirect_to_login_and_return
    end
  end

  def redirect_to_login_and_return
    redirect_to "/login?return_to=#{Rack::Utils.escape(request.fullpath)}"
  end

  # +before_filter+
  def adjust_format
    request.format = :data if request.xhr?
  end

  # +before_filter+
  def patch_microsoft_office
    if request.method == :options
      render :nothing => true, :status => :ok
      return false
    end
  end

  def needs_view_js(uid, view)
    (@view_cache ||= {})[uid] ||= view
  end

  # Custom logic for rendering a 404 page with our pretty templates.
  def render_optional_error_file(status_code)
    # Chicken and egg problem: When rendering some errors, such as a 404 page,
    # we never really made it to a controller at all - we failed at when
    # attempting to route the request. But our templates heavily depend on the
    # current user, so let's just hook the auth controller anyways so we can
    # render the template.
    UserSessionProvider.klass.controller = self

    if status_code == :not_found
      render_404
    elsif status_code == :internal_server_error
      render_500
    else
      super
    end
  end

  # If you're working on error templates locally, you probably want to
  # uncomment this code so you see the public-facing errors rather than
  # the usual development call stacks:
  # alias_method :rescue_action_locally, :rescue_action_in_public

  # +before_filter+
  def force_utf8_params
    traverse = lambda do |object, block|
      if object.kind_of?(Hash)
        object.each_value { |o| traverse.call(o, block) }
      elsif object.kind_of?(Array)
        object.each { |o| traverse.call(o, block) }
      else
        block.call(object)
      end
      object
    end
    force_encoding = lambda do |o|
      if o.respond_to?(:encode!)
        # EN-6382 - Handle invalid UTF-8 in URL parameters
        #
        # Sometimes (looks like usually when a BugCrowder is doing a 'pen
        # test') we get requests with invalid UTF-8 sequences in the URL. This
        # causes rather a lot of Airbrake errors.
        #
        # Sadly, it seems that we have tried to fix this issue at least twice
        # in the past but ultimately the implementation was flawed because it
        # was never reassigning the newly-created string (encode without the !
        # returns a new object that was getting lost in this lambda) so this
        # method effectively did nothing. We also previously attempted to encode
        # from UTF-8 to binary, which caused accented characters to be removed.
        #
        # Now that we are mutating the params and maintaining UTF-8 encoding, we
        # should see a significant drop in the number of Invalid UTF-8 Encoding
        # errors, although this change may expose other bugs which were
        # previously never encountered because this one would halt execution.
        o.encode!('UTF-8', 'UTF-8', invalid: :replace, undef: :replace, replace: '')
      end
    end
    traverse.call(params, force_encoding)
  end

  def check_chrome
    @suppress_chrome = params[:hide_chrome] == 'true'
  end

  # +before_filter+
  def poll_external_configs
    ExternalConfig.update_all!
  end

  # This is used by the DevelopmentCache class which is presently hiding inside styles_controller.rb
  def self.use_discrete_assets?
    Rails.env.development?
  end

  # TODO: Remove after DSLP launch  (note that this is not being localized intentionally
  # and we plan on removing it post-launch)
  #
  # Used in: ProfileController, AdministrationController, DatasetsController
  def display_dataset_landing_page_notice
    feature_flags = FeatureFlags.derive(nil, request)

    #EN-18397: Temporarily using manage_users as a proxy for a needed right
    should_display_notice = current_user.try(:has_right?, UserRights::MANAGE_USERS)  &&
      !dataset_landing_page_enabled? &&
      feature_flags.display_dataset_landing_page_notice == true

    if should_display_notice
      flash.now[:notice] = %{
        Notice to Socrata Administrators: You can now configure the header and footer for your site,
        including the links, colors, logos, and more. Tabular datasets also have a new front-page
        experience which surfaces content more intuitively. To preview these features and activate
        them on your site, please visit your <a href="/admin/site_appearance">Site Appearance</a> panel.
      }.html_safe
    end
  end

  def add_flash(key, message)
    flash[key] ||= []
    flash[key] << message unless flash[key].include?(message)
  end

end
