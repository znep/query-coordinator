class UserSessionsController < ApplicationController
  def new
    @user_session = UserSession.new
  end

  def create
    @user_session = UserSession.new(params[:user_session])
    if @user_session.save
      redirect_back_or_default root_url
    else
      render :action => :new
    end
  end

  def destroy
    if current_user_session
      current_user_session.destroy
    end
    redirect_to new_user_session_url
  end
end
