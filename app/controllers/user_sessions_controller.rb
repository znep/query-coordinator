class UserSessionsController < ApplicationController
  include ActionView::Helpers::TranslationHelper
  include UserSessionsHelper
  skip_before_filter :require_user
  protect_from_forgery :except => [:rpx]

  def index
    Airbrake.notify(
      :error_class => "Deprecation",
      :error_message => "Called UserSessionsController#index - deprecated function",
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

    # Auth0 Redirection when auth0 configuration is set
    auth0_redirect = CurrentDomain.configuration('auth0').try(:properties).try(:always_redirect_to)
    # Just make sure it's a valid URI.
    if auth0_redirect.present? && auth0_redirect =~ URI::regexp
      return redirect_to(auth0_redirect)
    end

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
    response.headers['ETag'] = ""
    session_response = current_user.nil? ? {:expired => "expired"} : current_user_session.extend
    render :json => session_response, :callback => params[:callback], :content_type => "application/json"
  end

  def expire_if_idle
    session_response = current_user.nil? ? {:expired => "expired"} : UserSession.find_seconds_until_timeout
    render :json => session_response, :callback => params[:callback], :content_type => "application/json"
  end

  def create
    @body_id = 'login'

    if current_user_session
      current_user_session.destroy
      @current_user = nil
    end
    # Tell Rack not to generate an ETag based off this content. Newer versions of Rack accept nil for this
    # purpose; but phusion passenger requires "".
    response.headers['ETag'] = ""
    @user_session = UserSession.new(params[:user_session])
    session_response = @user_session.save(true)
    if session_response.is_a?(Net::HTTPSuccess)
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
end
