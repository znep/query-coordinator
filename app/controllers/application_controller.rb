# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  before_filter :hook_auth_controller, :adjust_format, :require_user, :set_user, :set_locale
  helper :all # include all helpers, all the time
  helper_method :current_user
  helper_method :current_user_session
  layout 'main'

  filter_parameter_logging 'password'

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
  end

  def current_user
    @current_user ||= current_user_session ? current_user_session.user : nil
  end

  def current_user_session
    @current_user_session ||= UserSession.find
  end

private
  # Allow access to the current controller from the UserSession model.
  # UserSession itself is an ActiveRecord-like model, but it's mostly
  # concerned with setting session data, so it's easiest to just plumb
  # it through.
  def hook_auth_controller
    UserSession.controller = self
  end

  def require_user
    unless current_user_session
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

  def set_locale
    logger.info "Request domain: #{request.host}, Current locale: #{I18n.locale}"
    
    if (request.host.match('gov'))
      I18n.locale = 'gov'
    else
      # Force the locale back to blist if we're not datagov
      I18n.locale = 'blist'
    end
  end
end
