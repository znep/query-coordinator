class UserSessionsController < ApplicationController
  ssl_required :new, :create, :rpx
  ssl_allowed :destroy
  skip_before_filter :require_user
  protect_from_forgery :except => [:rpx]

  def index
    HoptoadNotifier.notify(
      :error_class => "Deprecation",
      :error_message => "Called UserSessionsController#index - deprecated function",
      :request => { :params => params }
    )
    respond_to do |format|
      format.data { render :json => {:user_id => current_user.nil? ? nil : current_user.id} }
    end
  end

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
        format.json { render :json => {:user_id => current_user.id}, :callback => params[:callback] }
      end
    else
      notice = "Unable to login with that username and password;" +
        " please try again"
      respond_to do |format|
        format.html do
          flash[:notice] = notice
          redirect_to login_url
        end
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

  def site_config
    session[:custom_site_config] = params[:config_id]
    respond_to do |format|
      format.html { render :text => 'Site configuration set to ' +
        session[:custom_site_config].to_s }
    end
  end

  def clear_site_config
    session[:custom_site_config] = nil
    respond_to do |format|
      format.html { render :text => 'Site configuration set back to default' }
    end
  end
end
