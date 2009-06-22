class UserSessionsController < ApplicationController
  skip_before_filter :require_user

  def new
    @body_id = 'login'
    @user_session = UserSession.new
    if params[:referer_redirect]
      session[:return_to] = request.referer
    end
  end

  def create
    @body_id = 'login'
    @user_session = UserSession.new(params[:user_session])
    if @user_session.save
      respond_to do |format|
        format.html { redirect_back_or_default(home_path) }
        format.data { render :json => {:user_id => current_user.id}}
      end
    else
      notice = "Unable to login with that username and password;" +
        " please try again"
      respond_to do |format|
        format.html do
          flash[:notice] = notice
          redirect_to login_path
        end
        format.data { render :json => {:error => notice}}
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
