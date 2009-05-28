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
      redirect_back_or_default(home_path)
    else
      flash[:notice] = "Unable to login with that username and password;" +
        " please try again"
      render :action => :new
    end
  end

  def destroy
    if current_user_session
      current_user_session.destroy
    end
    flash[:notice] = "You have been logged out"
    redirect_to(login_url)
  end
end
