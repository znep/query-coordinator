class UserSessionsController < ApplicationController
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
    @body_id = 'login'
    @user_session = UserSession.new
    if params[:referer_redirect]
      session[:return_to] = request.referer
    end
  end


  def create
    @body_id = 'login'

    if current_user_session
      current_user_session.destroy
      @current_user = nil
    end

    @user_session = UserSession.new(params[:user_session])
    response = @user_session.save(true)
    if response.is_a?(Net::HTTPSuccess)
      meter 'login.success'
      # need both .data and .json formats because firefox detects as .data and chrome detects as .json
      respond_to do |format|
        format.html {
          redirect_back_or_default(CurrentDomain.properties.on_login_path_override || profile_index_path)
        }
        format.data { render :json => {:user_id => current_user.id}, :callback => params[:callback] }
        format.json { render :json => {:user_id => current_user.id}, :callback => params[:callback] }
      end
    else
      default_response = 'Unable to login with that email and password; please try again'
      meter 'login.failure'
      if response.is_a?(Net::HTTPForbidden)
        response_error = JSON.parse(response.body)
        notice = response_error['message'] || default_response
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
    flash[:notice] = "You have been logged out"
    redirect_to(login_path)
  end
end
