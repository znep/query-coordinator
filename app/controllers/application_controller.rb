# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  include SslRequirement

  before_filter :hook_auth_controller, :adjust_format, :require_user, :set_user, :configure_theme
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

  def current_user
    @current_user ||= current_user_session ? current_user_session.user : nil
  end

  def current_user_session
    @current_user_session ||= UserSession.find
  end

  def render_404
    render_error(404)
  end

  def render_500
    render_error(500)
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

  # Patch the page caching support to handle our dynamic domain support.
  # (ie: the cache ends up in a directory based on the locale set via
  # the configure_theme parameter, and Apache uses the domain name of the
  # request to determine which directory to serve.)
  def self.cache_page(content, path)
    super(content, I18n.locale + path)
  end

  def self.expire_page(path)
    super(I18n.locale + path)
  end

protected
  # We use a custom page_cache_directory based on the theme of the site.
  # The builtin rails page_cache_file function is broken with this type of
  # implementation...
  def self.page_cache_file(path)
    if path == I18n.locale || path == I18n.locale + '/'
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
  end

  def require_user(force_login = false)
    unless current_user_session && !force_login
      store_location
      if request.method == :post
        session[:return_post_params] = params
      end
      flash[:notice] = "You must be logged in to access this page"
      redirect_to login_path
      return false
    end
  end

  def set_user
    if current_user_session
      @current_user = current_user_session.user
    end
  end

  def store_location
    session[:return_to] = request.request_uri
  end

  def redirect_back_or_default(path)
    return_params = session[:return_post_params]
    session[:return_post_params] = nil
    if return_params
      redirect_post(return_params)
    else
      redirect_to(session[:return_to] || path)
    end
    session[:return_to] = nil
  end

  # Borrowed from http://last10percent.com/2008/05/26/post-redirects-in-rails/
  def redirect_post(redirect_post_params)
    controller_name = redirect_post_params[:controller]
    controller = "#{controller_name.camelize}Controller".constantize
    # Throw out existing params and merge the stored ones
    request.parameters.reject! { true }
    request.parameters.merge!(redirect_post_params)
    controller.process(request, response)
    if response.redirected_to
      @performed_redirect = true
    else
      @performed_render = true
    end
  end

  def adjust_format
    request.format = :data if request.xhr?
  end

  def configure_theme
    logger.info "Request domain: #{request.host}, Current locale: #{I18n.locale}"

    Theme.configure request
  end

  # Custom logic for rendering a 404 page with our pretty templates.
  def render_optional_error_file(status_code)
    if status_code == :not_found
      render_404
    elsif status_code == :internal_server_error
      render_500
    else
      super
    end
  end

  def render_error(code)
    configure_theme
    respond_to do |format|
      format.html { render :template => "errors/error_#{code}", :layout => 'main', :status => code }
      format.all { render :nothing => true, :status => code }
    end
    true # so we can do "render_404 and return"
  end

  # If you're working on error templates locally, you probably want to
  # uncomment this code so you see the public-facing errors rather than
  # the usual development call stacks:
  # alias_method :rescue_action_locally, :rescue_action_in_public
end
