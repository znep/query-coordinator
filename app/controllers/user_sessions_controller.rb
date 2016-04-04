class UserSessionsController < ApplicationController

  include ActionView::Helpers::TranslationHelper
  include Auth0Helper
  include UserSessionsHelper

  skip_before_filter :require_user
  protect_from_forgery :except => [:rpx]

  # NOTE: This skip_before_filter must come _after_ the protect_from_forgery call above
  skip_before_filter :verify_authenticity_token,
    :if => lambda { |controller|
      controller.action_name == 'create' && (request.format.json? || request.format.data?)
    }

  before_filter :set_no_cache_store_headers

  def set_no_cache_store_headers
    response.headers['Cache-Control'] = 'no-cache, no-store'
  end

  def index
    Airbrake.notify(
      :error_class => 'Deprecation',
      :error_message => 'Called UserSessionsController#index - deprecated function',
      :request => { :params => params }
    )
    respond_to do |format|
      format.data { render :json => {:user_id => current_user.nil? ? nil : current_user.id} }
    end
  end

  def new
    # They got redirected here from an insecure page, most likely
    if current_user_session
      Rails.logger.warn("User landed on login page but was already logged in: #{current_user_session.inspect}")
      return redirect_back_or_default('/')
    end

    # Attempt to configure Auth0. This method may result in a redirect.
    auth0

    @body_id = 'login'
    @user_session = UserSession.new
    if params[:referer_redirect] || params[:return_to]
      # If specifying a return_to param, let that override request.referer
      session[:return_to] ||= params[:return_to] || request.referer
    end
  end

  def extend
    # Tell Rack not to generate an ETag based off this content. Newer versions of Rack accept nil for this
    # purpose; but phusion passenger requires "".
    response.headers['ETag'] = ''
    session_response = current_user.nil? ? {:expired => 'expired' } : current_user_session.extend
    render :json => session_response, :callback => params[:callback], :content_type => 'application/json'
  end

  def expire_if_idle
    session_response = current_user.nil? ? {:expired => 'expired' } : UserSession.find_seconds_until_timeout
    render :json => session_response, :callback => params[:callback], :content_type => 'application/json'
  end

  def create
    @body_id = 'login'

    if current_user_session
      current_user_session.destroy
      @current_user = nil
    end
    # Tell Rack not to generate an ETag based off this content. Newer versions of Rack accept nil for this
    # purpose; but phusion passenger requires "".
    response.headers['ETag'] = ''
    @user_session = UserSession.new(params[:user_session])
    session_response = @user_session.save(true)
    if session_response.is_a?(Net::HTTPSuccess)
      # User logged in successfully, but not using auth0...
      # check if we want to require auth0 for any of the user's roles
      if use_auth0? && !@user_session.user.is_admin?
        auth0_properties = CurrentDomain.configuration('auth0').try(:properties)

        if auth0_properties.present?
          restricted_roles = auth0_properties.try(:require_sso_for_rights)
          
          if restricted_roles.present? &&
             restricted_roles.any? { |role| @user_session.user.has_right?(role) }
            # user has a role that requires auth0... fail
            meter 'login.failure'
            @user_session.destroy
            flash[:error] = t('screens.sign_in.sso_required')
            redirect_to login_url and return
          end
        end
      end

      meter 'login.success'
      # need both .data and .json formats because firefox detects as .data and chrome detects as .json
      respond_to do |format|
        format.html {
          redirect_back_or_default(login_redirect_url)
        }
        format.data { render :json => {:user_id => current_user.id}, :callback => params[:callback] }
        format.json { render :json => {:user_id => current_user.id}, :callback => params[:callback] }
      end
    else
      default_response = t('screens.sign_in.failed')
      meter 'login.failure'
      if session_response.is_a?(Net::HTTPForbidden)
        response_error = JSON.parse(session_response.body)
        notice = case response_error['message']
          when 'Invalid username or password'
            t('core.auth.invalid_userpass')
          when 'Too many login attempts for that login. Account temporarily disabled.'
            t('core.auth.too_many_tries')
          when 'Unverified email address.'
            t('core.auth.need_email_verification')
          else
            default_response
          end
        notice += (notice.end_with?('.') ? '' : '.') + ' ' + t('account.common.form.lockout_warning')
      else
        notice = default_response
      end
      respond_to do |format|
        format.html do
          flash[:notice] = notice
          redirect_to login_url
        end
        format.data { render :json => {:error => notice}, :callback => params[:callback] }
        format.json { render :json => {:error => notice}, :callback => params[:callback] }
      end
    end
  end

  def destroy
    if current_user_session
      current_user_session.destroy
    end
    cookies.delete :remember_token
    flash[:notice] = t('core.dialogs.logout')
    redirect_to(login_path)
  end

  private

  ##
  # Tests an Auth0 connection string for redirection eligibility.
  # A client is redirect if:
  # 1. The connection is present.
  # 2. The connection actually exists in our Auth0 account.
  # 3. The client is making a fresh login attempt.
  # 4. The redirect parameter is NOT set.
  #
  # Redirect can be overriden by using ?redirect=false.
  def should_auth0_redirect?(connection)

      # Booleans to determine validity of redirect request
      connection_is_present = connection.present?
      connection_is_valid = connection_exists(connection)
      is_fresh_login = !(flash[:notice].present? && flash[:notice] == t('core.dialogs.logout'))
      has_redirect_param = params.fetch(:redirect, false)

      if connection_is_present && !connection_is_valid
        error = "A non-working connection string, #{connection}, has been specified in Auth0 configuration."

        Rails.logger.error(error)
        Airbrake.notify(:error_class => 'UnexpectedInput', :error_message => error)
      end

      connection_is_present && connection_is_valid && is_fresh_login && !has_redirect_param
  end

  ##
  # Tests an unknown variable with three requirements:
  # 1. It is an array.
  # 2. It is an array with hash maps.
  # 3. Each hash map has two parameters: connection and name.
  def valid_auth0_connections?(connections)
    valid = connections.kind_of?(Array) && connections.present?
    valid && connections.each do |connection|
      valid = connection[:connection].present? && connection[:name].present?
      break if !valid
    end

    valid
  end

  ##
  # Sets use_auth0 template variable.
  # Detects if automatic redirect is set and performs that redirect safely.
  #
  # If automatic redirect is not set, configured connections are set as
  # template variables.
  def auth0
    properties = CurrentDomain.configuration('auth0').try(:properties)

    if use_auth0? && properties.present?

      # Auth0 Redirection when auth0 configuration is set
      connection = properties.try(:auth0_always_redirect_connection)
      callback_uri = properties.try(:auth0_callback_uri)

      # Only redirect if this isn't a redirect from /logout.
      if should_auth0_redirect?(connection)
        uri = generate_authorize_uri(connection, callback_uri)
        return redirect_to(uri)
      else

        # If auth0 redirection is not possible/configured
        # we send the auth0_connections to the template and render
        # out appropriate buttons.

        connections = properties.try(:auth0_connections)

        if valid_auth0_connections?(connections)
          @auth0_connections = connections
        elsif connections.present?
          error = "auth0_connections, #{connections}, has been specified incorrectly in the Auth0 configuration."

          Rails.logger.error(error)
          Airbrake.notify(:error_class => 'UnexpectedInput', :error_message => error)
        end
        
        @auth0_message = properties.try(:auth0_message)
      end
    end
  end
end
