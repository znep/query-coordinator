# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  before_filter :hook_auth_controller,  :create_core_server_connection,
    :disable_frame_embedding, :adjust_format, :patch_microsoft_office, :sync_logged_in_cookie,
    :require_user, :set_user, :set_meta, :force_utf8_params
  helper :all # include all helpers, all the time
  helper_method :current_user
  helper_method :current_user_session
  layout 'main'

  rescue_from CoreServer::ResourceNotFound, :with => :render_404
  rescue_from ActionView::MissingTemplate, :with => :render_406

  # See ActionController::RequestForgeryProtection for details
  # Uncomment the :secret if you're not using the cookie session store
  protect_from_forgery # :secret => 'e231a1e478cd7112967644be164e057e'

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

  # See ActionController::Base for details 
  # Uncomment this to filter the contents of submitted sensitive data parameters
  # from your application log (in this case, all fields with names like "password").
  # filter_parameter_logging :password

  hide_action :current_user, :current_user_session, :prerendered_fragment_for, :require_module!, :require_that
  def current_user
    @current_user ||= current_user_session ? current_user_session.user : nil
  end

  def current_user_session
    @current_user_session ||= UserSession.find
  end

  def current_user_session=(user_session)
    @current_user_session = user_session
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

protected
  def render_403
    render_error(403)
  end

  def render_404
    render_error(404)
  end

  def render_406
    render_error(406)
  end

  def render_500
    render_error(500)
  end

  # v4 chrome style error messages
  def render_forbidden(message = I18n.t('core.auth.need_permission'))
    flash.now[:error] = message
    return render('shared/error', :status => :forbidden)
  end

  def is_mobile?
    return request.env['HTTP_USER_AGENT'] && request.env['HTTP_USER_AGENT'][/(iPhone|iPod|Android)/i]
  end

  # We use a custom page_cache_directory based on the theme of the site.
  # The builtin rails page_cache_file function is broken with this type of
  # implementation...
  def self.page_cache_file(path)
    if path == CurrentDomain.cname || path == CurrentDomain.cname + '/'
      name = path += "/index"
    else
      name = URI.unescape(path.chomp('/'))
    end

    name << page_cache_extension unless (name.split('/').last || name).include? '.'
    return name
  end

  def meter(name)
    ActiveSupport::Notifications.instrument :meter, :measurement => name
  end

  def set_user
    if current_user_session
      @current_user = current_user_session.user
    end
  end

private
  # Allow access to the current controller from the UserSession model.
  # UserSession itself is an ActiveRecord-like model, but it's mostly
  # concerned with setting session data, so it's easiest to just plumb
  # it through.
  def hook_auth_controller
    UserSession.controller = self
    UserSession.update_current_user(nil, nil)
  end

  # create the connection that can be used by all core server calls
  # made by this request
  def create_core_server_connection
    CoreServer::Base.connection = CoreServer::Connection.new(Rails.logger, cookies)
  end

  def default_url_options
    options = {}
    options[:locale] = I18n.locale.to_s if I18n.locale.to_s != CurrentDomain.default_locale
    options
  end

  def disable_frame_embedding
    headers['X-Frame-Options'] = 'SAMEORIGIN' if !@suppress_chrome
  end

  def sync_logged_in_cookie
    cookies.delete(:logged_in) unless current_user
  end

  # Sets socrata-specific headers so that a CDN or ATS may fully cache this HTML
  def can_be_cached
    ConditionalRequestHandler.set_cache_control_headers(response, true)
  end

  def require_user(force_login = false)
    unless current_user_session && !force_login
      if @suppress_chrome
        render_forbidden(I18n.t('core.auth.need_permission'))
      else
        store_location
        flash[:notice] = I18n.t('core.auth.need_login')
        redirect_to login_url
      end
      return false
    end
  end

  def set_meta
    # Set site meta tags as appropriate
    @meta = {
      :title => CurrentDomain.strings.site_title,
      'og:title' => CurrentDomain.strings.site_title,
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

    logo_square = CurrentDomain.theme[:images][:logo_square]
    if logo_square.present?
      if logo_square[:type].to_s == "static"
        @meta['og:image'] = @link_image_src = logo_square[:href]
      elsif logo_square[:type].to_s == "hosted"
        @meta['og:image'] = @link_image_src = "/assets/#{logo_square[:href]}"
      end
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

  def redirect_back_or_default(path)
    redirect_to(session[:return_to] || path)
    session[:return_to] = nil
  end

  def adjust_format
    request.format = :data if request.xhr?
  end

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
    UserSession.controller = self

    if status_code == :not_found
      render_404
    elsif status_code == :internal_server_error
      render_500
    else
      super
    end
  end

  def render_error(code)
    respond_to do |format|
      format.html do
        layout_to_use = 'main'
        layout_to_use = 'main_nodomain' unless CurrentDomain.set?
        render :template => "errors/error_#{code}", :layout => layout_to_use, :status => code
      end

      format.all { render :nothing => true, :status => code }
    end
    true # so we can do "render_404 and return"
  end

  # If you're working on error templates locally, you probably want to
  # uncomment this code so you see the public-facing errors rather than
  # the usual development call stacks:
  # alias_method :rescue_action_locally, :rescue_action_in_public

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
      o.force_encoding(Encoding::UTF_8) if o.respond_to?(:force_encoding)
    end
    traverse.call(params, force_encoding)
  end

  def check_chrome
    @suppress_chrome = params[:hide_chrome] == 'true'
  end
end
