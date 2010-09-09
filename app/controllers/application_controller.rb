# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  include SslRequirement

  before_filter :hook_auth_controller,  :create_core_server_connection,
    :adjust_format, :patch_microsoft_office, :sync_logged_in_cookie, :require_user, :set_user, :set_meta
  helper :all # include all helpers, all the time
  helper_method :current_user
  helper_method :current_user_session
  layout 'main'

  filter_parameter_logging 'password'

  rescue_from('CoreServer::ResourceNotFound') { |exception| render_404 }

  require 'pp'

  # See ActionController::RequestForgeryProtection for details
  # Uncomment the :secret if you're not using the cookie session store
  protect_from_forgery # :secret => 'e231a1e478cd7112967644be164e057e'

  # See ActionController::Base for details 
  # Uncomment this to filter the contents of submitted sensitive data parameters
  # from your application log (in this case, all fields with names like "password").
  # filter_parameter_logging :password

  def initialize
    @show_search_form = true
    @is_marketing_page = false
  end

  hide_action :current_user, :current_user_session, :prerendered_fragment_for, :require_module!, :require_that
  def current_user
    @current_user ||= current_user_session ? current_user_session.user : nil
  end

  def current_user_session
    @current_user_session ||= UserSession.find
  end

  def prerendered_fragment_for(buffer, name = {}, prerendered_content = nil, options = nil, &block)
    if perform_caching
      if prerendered_content
        buffer.concat(prerendered_content)
      else
        pos = buffer.length
        block.call
        write_fragment(name, buffer[pos..-1], options)
      end
    else
      block.call
    end
  end

  def require_module!(name)
    render_404 unless CurrentDomain.feature?(name.to_s) &&
                      CurrentDomain.module_available?(name.to_s)
  end

  def require_that(enabled)
    render_404 unless enabled
  end

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

protected
  def render_403
    render_error(403)
  end

  def render_404
    render_error(404)
  end

  def render_500
    render_error(500)
  end

  # v4 chrome style error messages
  def render_forbidden(message = 'You do not have permission to view this page')
    flash.now[:error] = message
    return render('shared/error', :status => :forbidden)
  end

  # Render a 404 error, or redirect to '/solution' if upsell is enabled
  def upsell_or_404
    if CurrentDomain.upsell?
      redirect_to '/solution'
    else
      render_404
    end
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

  def sync_logged_in_cookie
    cookies.delete(:logged_in) unless current_user
  end

  def require_user(force_login = false)
    unless current_user_session && !force_login
      store_location
      flash[:notice] = "You must be logged in to access this page"
      redirect_to login_path
      return false
    end
  end

  def require_domain_member
    return render_forbidden unless CurrentDomain.member?(current_user)
  end

  def set_user
    if current_user_session
      @current_user = current_user_session.user
    end
  end

  def set_meta
    # Set site meta tags as appropriate
    @meta = {
      :title => CurrentDomain.strings.site_title,
      'og:title' => CurrentDomain.strings.site_title,
      'og:site_name' => CurrentDomain.name,
      :description => CurrentDomain.strings.meta_description,
      'og:description' => CurrentDomain.strings.meta_description,
      'og:type' => 'article',
      'og:url' => request.request_uri
    }

    # HACK/TODO: resolve this when v4-chrome gets merged into master.
    logo_square = CurrentDomain.theme[:images][:logo_square]
    if logo_square.nil?
      return
    elsif logo_square[:type].to_s == "static"
      @meta['og:image'] = @link_image_src = logo_square[:source]
    elsif logo_square[:type].to_s == "hosted"
      @meta['og:image'] = @link_image_src = "/assets/#{logo_square[:source]}"
    end
  end

  def store_location
    session[:return_to] = request.request_uri
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
        begin
          render :template => "errors/error_#{code}", :layout => 'main', :status => code
        rescue
          render :template => "errors/error_#{code}_nodomain", :layout => 'main_nodomain', :status => code
        end
      end

      format.all { render :nothing => true, :status => code }
    end
    true # so we can do "render_404 and return"
  end

  # If you're working on error templates locally, you probably want to
  # uncomment this code so you see the public-facing errors rather than
  # the usual development call stacks:
  # alias_method :rescue_action_locally, :rescue_action_in_public

  def choose_v4_layout
    if action_name =~ /^v4/
      'dataset_v2'
    else
      'main'
    end
  end
end
