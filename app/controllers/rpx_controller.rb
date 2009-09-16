class RpxController < ApplicationController
  ssl_required :return_token, :login, :signup
  skip_before_filter :require_user
  protect_from_forgery :except => [:return_token]
  before_filter :set_empty_user_session

  def return_token
    return (redirect_to login_path) unless params[:token]

    rpx_authentication = RpxAuthentication.new(params[:token])
    if (rpx_authentication.existing_account?)
      user_session = UserSession.rpx(rpx_authentication)
      redirect_back_or_default(home_path)
    else
      @signup = SignupPresenter.new
      @signup.user = rpx_authentication.user if rpx_authentication.user
    end
  end

  def signup
    @signup = SignupPresenter.new(params[:signup])
    if @signup.create
      redirect_back_or_default(home_path)
    else
      flash.now[:error] = @signup.errors.join(", ")
      render :action => :return_token
    end
  end

  def login
    @signup = SignupPresenter.new(params[:signup])
    @user_session = UserSession.new(params[:user_session])
    if @user_session.save
      current_user.openIdIdentifierId = @signup.openIdIdentifierId
      current_user.save!
      redirect_to(account_path(:anchor => "openid"))
    else
      flash.now[:tab] = "loginTab"
      flash.now[:notice_login] = "Unable to login with that username and password; please try again"
      render :action => :return_token
    end
  end

private
  def set_empty_user_session
    @user_session = UserSession.new
  end
end
