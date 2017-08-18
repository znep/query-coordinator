class UserSessionsController < ApplicationController

  include ActionView::Helpers::TranslationHelper
  include Auth0Helper
  include UserSessionsHelper

  skip_before_filter :require_user

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
    # EN-6285 - Address Frontend app Airbrake errors
    #
    # We were previously notifying Airbrake of a deprecation notice on
    # UserSessionsController#index, a notification which was created in 2009
    # and has presumably been notifying Airbrake ever since. The frequency with
    # which this notification happens (5.5k times over the past 3 months) leads
    # me to be believe that if this method was deprecated, we never told
    # anybody about it.
    #
    # The notification is now gone, but interested parties can find it in
    # commit ec208d81875d511c87196b8c986d1d0b1deb50a0.
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
    @user_session = UserSessionProvider.klass.new
    if params[:referer_redirect] || params[:return_to]
      # If specifying a return_to param, let that override request.referer
      session[:return_to] ||= params[:return_to] || request.referer
    end

    render :layout => 'styleguide' if use_auth0? && !performed?
  end

  def expire_if_idle
    session_response = current_user.nil? ? {:expired => 'expired' } : UserSessionProvider.klass.find_seconds_until_timeout
    render :json => session_response, :callback => params[:callback], :content_type => 'application/json'
  end

  def create
    @body_id = 'login'

    # In general, if we get here it means that a user session has been created by submitting a login form straight to Rails
    # If auth0 is enabled, we mostly disallow this.
    if use_auth0? &&
       params.key?(:user_session) &&
       params[:user_session].key?(:login)
      # We allow @socrata.com users to bypass auth0 if a module is turned on, but only when the fedramp module is off.
      # The purpose of this is to restrict superadmin logins to ensure MFA through Okta, and "@socrata.com users" is a
      # superset of superadmins.
      # This is enforced in the javascript but we have to enforce it here as well.
      if Rails.env.production? && params[:user_session][:login].include?('@socrata.com')
        if feature?('fedramp')
          flash[:error] = t('screens.sign_in.sso_required_for_superadmins_by_fedramp')
          redirect_to login_url and return
        end

        unless feature?('socrata_emails_bypass_auth0')
          flash[:error] = t('screens.sign_in.sso_required_for_superadmins_by_default')
          redirect_to login_url and return
        end
      end
    end

    if current_user_session
      current_user_session.destroy
      @current_user = nil
    end
    # Tell Rack not to generate an ETag based off this content. Newer versions of Rack accept nil for this
    # purpose; but phusion passenger requires "".
    response.headers['ETag'] = ''

    @user_session = UserSessionProvider.klass.new(params[:user_session])
    session_response = @user_session.save(true)

    if session_response.is_a?(Net::HTTPSuccess)
      # User logged in successfully, but not using auth0...
      # check if we want to require auth0 for any of the user's roles
      if use_auth0? && !@user_session.user.is_superadmin?
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
    kill_session_and_cookies

    if use_auth0?
      # here, we redirect them to auth0 and then back to "signed_out"
      redirect_to(generate_auth0_logout_uri)
    else
      # not using auth0, so display the flash and go back to "login"
      flash[:notice] = t('core.dialogs.logout')
      redirect_to(login_path)
    end
  end

  def signed_out
    kill_session_and_cookies
    render :layout => 'styleguide'
  end

  private

  def kill_session_and_cookies
    if current_user_session
      current_user_session.destroy
    end
    cookies.delete :remember_token
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
      callback_uri = properties.try(:auth0_callback_uri) || "https://#{CurrentDomain.cname}/auth/auth0/callback"

      # Only redirect if this isn't a redirect from /logout.
      if should_auth0_redirect?(connection)
        uri = generate_authorize_uri(connection, callback_uri)
        return redirect_to(uri)
      else
        set_auth0_variables_from_config(properties)
      end
    end
  end
end
